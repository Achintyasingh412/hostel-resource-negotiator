import { and, desc, eq, getTableColumns, gte, lt, lte, ne } from "drizzle-orm";
import { db } from "@/lib/db";
import { hostelProfiles, resourceBookings, wardenLog } from "@/lib/db/schema";
import { COMMUNITY_ID, MAX_WEEKLY_CREDITS } from "@/lib/hostel-constants";

function getWeekStart(date = new Date()) {
  const day = date.getUTCDay();
  const daysSinceMonday = (day + 6) % 7;
  date.setUTCDate(date.getUTCDate() - daysSinceMonday);
  return date.toISOString().slice(0, 10);
}

export function getToday() {
  return new Date().toISOString().slice(0, 10);
}

export async function ensureHostelProfile(userId: string) {
  const weekStart = getWeekStart(new Date());
  await db
    .insert(hostelProfiles)
    .values({
      userId,
      hostelUid: userId,
      credits: MAX_WEEKLY_CREDITS,
      weekStart,
    })
    .onConflictDoNothing({ target: hostelProfiles.userId });

  await db
    .update(hostelProfiles)
    .set({ credits: MAX_WEEKLY_CREDITS, weekStart, updatedAt: new Date() })
    .where(and(eq(hostelProfiles.userId, userId), lt(hostelProfiles.weekStart, weekStart)));

  await db
    .update(hostelProfiles)
    .set({ hostelUid: userId })
    .where(and(eq(hostelProfiles.userId, userId), ne(hostelProfiles.hostelUid, userId)));

  const [profile] = await db
    .select({ hostelUid: hostelProfiles.hostelUid, credits: hostelProfiles.credits })
    .from(hostelProfiles)
    .where(eq(hostelProfiles.userId, userId))
    .limit(1);

  if (!profile) throw new Error("Unable to load your hostel profile.");
  return profile;
}

export async function getHostelDashboardData(user: { id: string; name: string }, date = getToday()) {
  const profile = await ensureHostelProfile(user.id);
  const latestDate = new Date(`${date}T00:00:00.000Z`);
  latestDate.setUTCDate(latestDate.getUTCDate() + 14);
  const throughDate = latestDate.toISOString().slice(0, 10);
  const [upcomingBookings, myBookings, logEntries] = await Promise.all([
    db
      .select()
      .from(resourceBookings)
      .where(
        and(
          eq(resourceBookings.communityId, COMMUNITY_ID),
          gte(resourceBookings.bookingDate, date),
          lte(resourceBookings.bookingDate, throughDate),
          eq(resourceBookings.status, "ACTIVE"),
        ),
      )
      .orderBy(resourceBookings.slot),
    db
      .select()
      .from(resourceBookings)
      .where(
        and(
          eq(resourceBookings.communityId, COMMUNITY_ID),
          eq(resourceBookings.userId, user.id),
        ),
      )
      .orderBy(desc(resourceBookings.bookedAt)),
    db
      .select({
        ...getTableColumns(wardenLog),
        actorHostelUid: hostelProfiles.hostelUid,
      })
      .from(wardenLog)
      .leftJoin(hostelProfiles, eq(wardenLog.actorUserId, hostelProfiles.userId))
      .where(eq(wardenLog.communityId, COMMUNITY_ID))
      .orderBy(desc(wardenLog.createdAt)),
  ]);

  return {
    profile,
    date,
    upcomingBookings,
    myBookings,
    logEntries,
    user: { id: user.id, name: user.name },
  };
}

export type HostelDashboardData = Awaited<ReturnType<typeof getHostelDashboardData>>;
