"use server";

import { and, eq, gt, sql } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { getDemoSession, createDemoSession, clearDemoSession } from "@/lib/demo-session";
import { verifyDemoCredentials } from "@/lib/demo-users";
import { db } from "@/lib/db";
import { hostelProfiles, resourceBookings, wardenLog } from "@/lib/db/schema";
import { COMMUNITY_ID, HOSTEL_RESOURCES, HOSTEL_SLOTS, MAX_WEEKLY_CREDITS } from "@/lib/hostel-constants";
import { ensureHostelProfile, getToday } from "@/lib/hostel-data";

async function getUser() {
  const session = await getDemoSession();
  if (!session) throw new Error("Please sign in to continue.");
  return session;
}

export async function loginDemoUser(uid: string, passcode: string) {
  const user = verifyDemoCredentials(uid, passcode);
  if (!user) return { ok: false as const, error: "That UID and PIN combination isn’t valid." };

  await createDemoSession(user.id);
  return { ok: true as const };
}

export async function logoutDemoUser() {
  await clearDemoSession();
}

function isValidDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value) return false;
  const earliest = new Date(`${getToday()}T00:00:00.000Z`);
  const latest = new Date(earliest);
  latest.setUTCDate(latest.getUTCDate() + 14);
  return parsed >= earliest && parsed <= latest;
}

function friendlyError(error: unknown) {
  const cause = error as { code?: string; message?: string };
  if (cause?.code === "23505") return "That slot was just claimed. Choose another open time.";
  if (cause?.message === "NO_CREDITS") return "You’re out of weekly credits. Cancel a booking to get one back.";
  if (cause?.message === "BOOKING_NOT_FOUND") return "That active booking could not be found.";
  return "We couldn’t complete that request. Please try again.";
}

export async function reserveSlot(input: {
  resource: string;
  slot: string;
  date: string;
  wardenNote: string;
}) {
  const user = await getUser();
  if (
    !input ||
    typeof input.resource !== "string" ||
    typeof input.slot !== "string" ||
    typeof input.date !== "string"
  ) {
    return { ok: false as const, error: "Choose a resource, time, and date." };
  }
  if (!(HOSTEL_RESOURCES as readonly string[]).includes(input.resource)) {
    return { ok: false as const, error: "Choose a resource from the list." };
  }
  if (!(HOSTEL_SLOTS as readonly string[]).includes(input.slot) || !isValidDate(input.date)) {
    return { ok: false as const, error: "Choose a valid time and a date within the next two weeks." };
  }
  const wardenNote = typeof input.wardenNote === "string" ? input.wardenNote.trim().slice(0, 600) : "";

  try {
    await ensureHostelProfile(user.id);
    await db.transaction(async (tx) => {
      const [credit] = await tx
        .update(hostelProfiles)
        .set({ credits: sql`${hostelProfiles.credits} - 1`, updatedAt: new Date() })
        .where(and(eq(hostelProfiles.userId, user.id), gt(hostelProfiles.credits, 0)))
        .returning({ userId: hostelProfiles.userId });
      if (!credit) throw new Error("NO_CREDITS");

      const bookingId = randomUUID();
      await tx.insert(resourceBookings).values({
        id: bookingId,
        communityId: COMMUNITY_ID,
        userId: user.id,
        userName: user.name,
        resource: input.resource,
        slot: input.slot,
        bookingDate: input.date,
        wardenNote,
      });
      await tx.insert(wardenLog).values({
        id: randomUUID(),
        communityId: COMMUNITY_ID,
        event: "BOOKING",
        actorUserId: user.id,
        actorName: user.name,
        resource: input.resource,
        slot: input.slot,
        bookingDate: input.date,
        note: wardenNote,
      });
    });
    revalidatePath("/");
    return { ok: true as const };
  } catch (error) {
    return { ok: false as const, error: friendlyError(error) };
  }
}

export async function cancelBooking(bookingId: string) {
  const user = await getUser();
  if (typeof bookingId !== "string" || !/^[\da-f-]{36}$/i.test(bookingId)) {
    return { ok: false as const, error: "That booking could not be found." };
  }

  try {
    await db.transaction(async (tx) => {
      const [booking] = await tx
        .select()
        .from(resourceBookings)
        .where(
          and(
            eq(resourceBookings.id, bookingId),
            eq(resourceBookings.communityId, COMMUNITY_ID),
            eq(resourceBookings.userId, user.id),
            eq(resourceBookings.status, "ACTIVE"),
          ),
        )
        .for("update")
        .limit(1);
      if (!booking) throw new Error("BOOKING_NOT_FOUND");

      const cancelledAt = new Date();
      await tx
        .update(resourceBookings)
        .set({ status: "CANCELLED", cancelledAt })
        .where(eq(resourceBookings.id, bookingId));
      await tx
        .update(hostelProfiles)
        .set({
          credits: sql`LEAST(${MAX_WEEKLY_CREDITS}, ${hostelProfiles.credits} + 1)`,
          updatedAt: cancelledAt,
        })
        .where(eq(hostelProfiles.userId, user.id));
      await tx.insert(wardenLog).values({
        id: randomUUID(),
        communityId: COMMUNITY_ID,
        event: "CANCELLATION",
        actorUserId: user.id,
        actorName: user.name,
        resource: booking.resource,
        slot: booking.slot,
        bookingDate: booking.bookingDate,
        note: `Slot released. One weekly credit refunded. Booking ${booking.id}.`,
        createdAt: cancelledAt,
      });
    });
    revalidatePath("/");
    return { ok: true as const };
  } catch (error) {
    return { ok: false as const, error: friendlyError(error) };
  }
}
