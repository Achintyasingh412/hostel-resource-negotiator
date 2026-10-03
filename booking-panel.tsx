"use client";

import { useState, useTransition } from "react";
import { CalendarDays, Check, Clock3, LoaderCircle, LockKeyhole, Sparkles } from "lucide-react";
import { reserveSlot } from "@/app/actions";
import { HOSTEL_RESOURCES, HOSTEL_SLOTS, MAX_WEEKLY_CREDITS } from "@/lib/hostel-constants";
import type { HostelDashboardData } from "@/lib/hostel-data";
import { localWardenNote } from "@/lib/ollama-client";

const localFallback = "The local warden is away for chai. Your slot is confirmed; return the equipment clean and on time.";
const resourceIcons = ["01", "02", "03", "04", "05", "06"];

function formatDate(value: string) {
  return new Date(`${value}T12:00:00`).toLocaleDateString(undefined, {
    weekday: "short", month: "short", day: "numeric",
  });
}

type BookingPanelProps = {
  data: HostelDashboardData;
  model: string;
  onBooked: () => void;
};

export function BookingPanel({ data, model, onBooked }: BookingPanelProps) {
  const [date, setDate] = useState(data.date);
  const [resource, setResource] = useState<string>(HOSTEL_RESOURCES[0]);
  const [slot, setSlot] = useState<string>(HOSTEL_SLOTS[0]);
  const [pending, startTransition] = useTransition();
  const [notice, setNotice] = useState<{ kind: "error" | "success" | "info"; text: string } | null>(null);

  const activeBookings = data.upcomingBookings.filter((booking) => booking.bookingDate === date);
  const occupied = activeBookings.find((booking) => booking.resource === resource && booking.slot === slot);
  const canBook = data.profile.credits > 0 && !occupied && !pending;

  function handleReserve() {
    setNotice(null);
    startTransition(async () => {
      let note = localFallback;
      let ollamaOffline = false;
      try {
        note = await localWardenNote(model, data.user.name, resource, slot);
      } catch {
        ollamaOffline = true;
      }
      const result = await reserveSlot({ resource, slot, date, wardenNote: note });
      if (!result.ok) {
        setNotice({ kind: "error", text: result.error });
        return;
      }
      setNotice({
        kind: ollamaOffline ? "info" : "success",
        text: ollamaOffline
          ? "Reserved. Ollama was unavailable, so the local fallback note was used."
          : "Reserved. One weekly credit used.",
      });
      onBooked();
    });
  }

  return (
    <section className="surface booking-surface" aria-labelledby="booking-title">
      <div className="surface-heading">
        <div>
          <span className="section-kicker">MAKE IT YOURS</span>
          <h2 id="booking-title">Book a resource</h2>
          <p>One credit per reservation. Cancel anytime for a refund.</p>
        </div>
        <div className="credits-chip"><span className="credit-dot" /> {data.profile.credits} <span>/ {MAX_WEEKLY_CREDITS}</span></div>
      </div>

      <div className="booking-controls">
        <label className="field-label date-field">
          <span><CalendarDays aria-hidden="true" /> Date</span>
          <input
            aria-label="Booking date"
            type="date"
            value={date}
            min={data.date}
            max={new Date(`${data.date}T00:00:00.000Z`).toISOString().slice(0, 10) === data.date
              ? new Date(Date.now() + 14 * 86_400_000).toISOString().slice(0, 10)
              : undefined}
            onChange={(event) => setDate(event.target.value)}
          />
        </label>
        <div className="field-label">
          <span><LockKeyhole aria-hidden="true" /> Hostel UID</span>
          <div className="uid-value">{data.profile.hostelUid}</div>
        </div>
      </div>

      <div className="resource-picker" role="group" aria-label="Choose a resource">
        {HOSTEL_RESOURCES.map((item, index) => (
          <button
            className={`resource-option${resource === item ? " is-selected" : ""}`}
            key={item}
            type="button"
            aria-pressed={resource === item}
            onClick={() => { setResource(item); setNotice(null); }}
          >
            <span className="resource-number">{resourceIcons[index]}</span>
            <span>{item}</span>
            {resource === item && <Check aria-hidden="true" />}
          </button>
        ))}
      </div>

      <div className="slots-heading">
        <div><Clock3 aria-hidden="true" /><span>Choose an hour</span></div>
        <span className="date-caption">{formatDate(date)}</span>
      </div>
      <div className="slot-list" role="group" aria-label="Available time slots">
        {HOSTEL_SLOTS.map((item) => {
          const current = activeBookings.find((booking) => booking.resource === resource && booking.slot === item);
          const isSelected = slot === item;
          return (
            <button
              key={item}
              className={`slot-option${current ? " is-taken" : ""}${isSelected ? " is-selected" : ""}`}
              type="button"
              disabled={Boolean(current)}
              aria-pressed={isSelected}
              aria-label={current ? `${item}, reserved by ${current.userName}` : `${item}, ${isSelected ? "selected" : "available"}`}
              title={current ? `Reserved by ${current.userName}` : undefined}
              onClick={() => { setSlot(item); setNotice(null); }}
            >
              <span>{item.split(" – ")[0]}</span>
              <span className="slot-state">{current ? `By ${current.userName}` : isSelected ? "Selected" : "Available"}</span>
            </button>
          );
        })}
      </div>

      {occupied && <p className="inline-hint">This resource is already reserved for the selected hour.</p>}
      {!data.profile.credits && <p className="inline-hint">You’re out of weekly credits. Cancel a reservation to get one back.</p>}
      {notice && <p className={`action-notice ${notice.kind}`} role={notice.kind === "error" ? "alert" : "status"}>{notice.text}</p>}

      <button className="button button-primary reserve-button" type="button" disabled={!canBook} onClick={handleReserve}>
        {pending ? <LoaderCircle className="spin" aria-hidden="true" /> : <Sparkles aria-hidden="true" />}
        {pending ? "Checking with your local warden…" : "Reserve this slot"}
      </button>
      <p className="privacy-caption">Warden commentary is generated on your device with Ollama. No message leaves your browser.</p>
    </section>
  );
}
