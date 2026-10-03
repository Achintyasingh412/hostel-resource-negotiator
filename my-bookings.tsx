"use client";

import { useState, useTransition } from "react";
import { CalendarDays, CheckCircle2, Clock3, LoaderCircle, RotateCcw } from "lucide-react";
import { cancelBooking } from "@/app/actions";
import type { HostelDashboardData } from "@/lib/hostel-data";

function formatDate(value: string) {
  return new Date(`${value}T12:00:00`).toLocaleDateString(undefined, {
    weekday: "short", month: "short", day: "numeric", year: "numeric",
  });
}

export function MyBookings({ bookings, onChanged }: {
  bookings: HostelDashboardData["myBookings"];
  onChanged: () => void;
}) {
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [notice, setNotice] = useState("");
  const [pending, startTransition] = useTransition();
  const activeCount = bookings.filter((booking) => booking.status === "ACTIVE").length;

  function cancel(id: string) {
    setPendingId(id);
    setNotice("");
    startTransition(async () => {
      const result = await cancelBooking(id);
      setPendingId(null);
      if (result.ok) onChanged();
      else setNotice(result.error);
    });
  }

  return (
    <section className="surface" aria-labelledby="my-bookings-title">
      <div className="surface-heading">
        <div><span className="section-kicker">YOUR PLANS</span><h2 id="my-bookings-title">My bookings</h2>
          <p>{activeCount} active reservation{activeCount === 1 ? "" : "s"}. Cancellations stay in the Warden Log.</p>
        </div>
        <span className="history-count">{bookings.length} TOTAL</span>
      </div>
      {notice && <p className="action-notice error" role="alert">{notice}</p>}
      {bookings.length === 0 ? (
        <div className="empty-state"><CalendarDays aria-hidden="true" /><h3>A little room in your schedule</h3><p>Your reservations will show up here.</p></div>
      ) : (
        <div className="booking-history-list">
          {bookings.map((booking) => {
            const active = booking.status === "ACTIVE";
            return (
              <article className={`history-card${active ? "" : " is-cancelled"}`} key={booking.id}>
                <div className="history-icon">{active ? <Clock3 aria-hidden="true" /> : <CheckCircle2 aria-hidden="true" />}</div>
                <div className="history-content">
                  <div className="history-title-row"><h3>{booking.resource}</h3><span className={`status-badge${active ? " active" : " cancelled"}`}>{active ? "ACTIVE" : "CANCELLED"}</span></div>
                  <p><CalendarDays aria-hidden="true" /> {formatDate(booking.bookingDate)} <span>·</span> {booking.slot}</p>
                  {booking.wardenNote && <blockquote>{booking.wardenNote}</blockquote>}
                  {!active && booking.cancelledAt && <small>Released {new Date(booking.cancelledAt).toLocaleString()}</small>}
                </div>
                {active && (
                  <button className="button button-quiet cancel-button" type="button" disabled={pending} onClick={() => cancel(booking.id)}>
                    {pending && pendingId === booking.id ? <LoaderCircle className="spin" aria-hidden="true" /> : <RotateCcw aria-hidden="true" />}
                    Cancel &amp; refund
                  </button>
                )}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
