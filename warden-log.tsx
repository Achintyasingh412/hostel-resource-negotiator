"use client";

import { useMemo, useState } from "react";
import { ArrowDownLeft, ArrowUpRight, ClipboardList, Search } from "lucide-react";
import type { HostelDashboardData } from "@/lib/hostel-data";

type Filter = "ALL" | "BOOKING" | "CANCELLATION";

export function WardenLog({ entries }: { entries: HostelDashboardData["logEntries"] }) {
  const [filter, setFilter] = useState<Filter>("ALL");
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => entries.filter((entry) => {
    const matchesFilter = filter === "ALL" || entry.event === filter;
    const searchable = `${entry.actorName} ${entry.resource} ${entry.slot} ${entry.actorHostelUid ?? entry.actorUserId}`.toLowerCase();
    return matchesFilter && searchable.includes(query.trim().toLowerCase());
  }), [entries, filter, query]);
  const bookings = entries.filter((entry) => entry.event === "BOOKING").length;
  const cancellations = entries.filter((entry) => entry.event === "CANCELLATION").length;

  return (
    <section className="surface" aria-labelledby="warden-log-title">
      <div className="surface-heading">
        <div><span className="section-kicker">THE HOUSE RECORD</span><h2 id="warden-log-title">Warden Log</h2>
          <p>Every reservation and release, visible to the whole community.</p>
        </div>
        <span className="history-count">APPEND-ONLY</span>
      </div>
      <div className="log-stats" aria-label="Activity summary">
        <div><span>{entries.length}</span><small>RECENT EVENTS</small></div>
        <div><span>{bookings}</span><small>RESERVATIONS</small></div>
        <div><span>{cancellations}</span><small>RELEASES</small></div>
      </div>
      <div className="log-tools">
        <label className="log-search"><Search aria-hidden="true" /><span className="sr-only">Search activity</span>
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Find a person or resource" />
        </label>
        <div className="filter-group" role="group" aria-label="Filter activity">
          {(["ALL", "BOOKING", "CANCELLATION"] as const).map((item) => (
            <button key={item} type="button" aria-pressed={filter === item} className={filter === item ? "filter-button is-selected" : "filter-button"} onClick={() => setFilter(item)}>
              {item === "ALL" ? "All" : item === "BOOKING" ? "Booked" : "Released"}
            </button>
          ))}
        </div>
      </div>
      {filtered.length === 0 ? (
        <div className="empty-state compact"><ClipboardList aria-hidden="true" /><h3>No matching activity</h3><p>Try another filter or search term.</p></div>
      ) : (
        <ol className="log-list">
          {filtered.map((entry) => {
            const booked = entry.event === "BOOKING";
            return (
              <li className="log-entry" key={entry.id}>
                <span className={`log-mark ${booked ? "booked" : "released"}`}>{booked ? <ArrowUpRight aria-hidden="true" /> : <ArrowDownLeft aria-hidden="true" />}</span>
                <div className="log-entry-content">
                  <div className="log-main-line"><strong>{entry.actorName}</strong><span className={`log-verb ${booked ? "booked" : "released"}`}>{booked ? "reserved" : "released"}</span><span className="log-resource">{entry.resource}</span></div>
                  <div className="log-meta"><span>{entry.actorHostelUid ?? entry.actorUserId}</span><span>·</span><span>{entry.bookingDate}</span><span>·</span><span>{entry.slot}</span></div>
                  {entry.note && <p className="log-note">{entry.note}</p>}
                </div>
                <time className="log-time" dateTime={new Date(entry.createdAt).toISOString()}>{new Date(entry.createdAt).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</time>
              </li>
            );
          })}
        </ol>
      )}
      <p className="privacy-caption log-caption">No entries can be deleted from this view. Old reservations remain visible here after cancellation.</p>
    </section>
  );
}
