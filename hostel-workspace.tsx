"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowUpRight, BookOpen, Building2, CalendarDays, CheckCircle2, ChevronRight,
  ClipboardList, DoorOpen, LogOut, Sparkles, UsersRound,
} from "lucide-react";
import { logoutDemoUser } from "@/app/actions";
import type { HostelDashboardData } from "@/lib/hostel-data";
import { BookingPanel } from "@/components/booking-panel";
import { MyBookings } from "@/components/my-bookings";
import { OllamaCompanion } from "@/components/ollama-companion";
import { WardenLog } from "@/components/warden-log";

type Section = "dashboard" | "bookings" | "log" | "companion";

const navigation: { id: Section; label: string; icon: typeof Building2 }[] = [
  { id: "dashboard", label: "Overview", icon: Building2 },
  { id: "bookings", label: "My bookings", icon: CalendarDays },
  { id: "log", label: "Warden Log", icon: ClipboardList },
  { id: "companion", label: "Local AI", icon: Sparkles },
];

export function HostelWorkspace({ data }: { data: HostelDashboardData }) {
  const [section, setSection] = useState<Section>("dashboard");
  const [model, setModel] = useState("llama3.2");
  const router = useRouter();
  const firstName = data.user.name.trim().split(/\s+/)[0] || "there";
  const activeBookings = data.myBookings.filter((booking) => booking.status === "ACTIVE").length;
  const occupiedToday = data.upcomingBookings.filter((booking) => booking.bookingDate === data.date).length;

  async function signOut() {
    await logoutDemoUser();
    router.replace("/sign-in");
    router.refresh();
  }

  function refreshData() {
    router.refresh();
  }

  return (
    <main className="app-frame">
      <header className="topbar">
        <a className="brand-lockup" href="/" aria-label="Hostel Nexus dashboard">
          <span className="brand-mark"><Building2 aria-hidden="true" /></span>
          <span>hostel<span className="brand-accent">nexus</span></span>
        </a>
        <div className="topbar-center"><span className="online-indicator" /> Wing 4B <span className="topbar-divider">/</span> Shared living</div>
        <div className="topbar-user">
          <div className="user-id"><span className="user-avatar">{firstName.slice(0, 1).toUpperCase()}</span><span><strong>{data.user.name}</strong><small>{data.profile.hostelUid}</small></span></div>
          <button className="icon-button sign-out-button" type="button" onClick={signOut} aria-label="Sign out" title="Sign out"><LogOut aria-hidden="true" /></button>
        </div>
      </header>

      <div className="workspace-grid">
        <aside className="sidebar" aria-label="Main navigation">
          <div className="sidebar-label">YOUR HOUSE</div>
          <nav className="side-nav" aria-label="Hostel sections">
            {navigation.map(({ id, label, icon: Icon }) => (
              <button key={id} className={`nav-item${section === id ? " is-current" : ""}`} type="button" aria-current={section === id ? "page" : undefined} onClick={() => setSection(id)}>
                <Icon aria-hidden="true" /><span>{label}</span>{id === "log" && <span className="nav-count">LIVE</span>}
              </button>
            ))}
          </nav>
          <div className="sidebar-card">
            <span className="sidebar-card-icon"><UsersRound aria-hidden="true" /></span>
            <strong>Good neighbors,<br />good house.</strong>
            <p>Fair turns make better shared spaces. Every booking is visible in the Warden Log.</p>
            <button type="button" onClick={() => setSection("log")}>See the house record <ChevronRight aria-hidden="true" /></button>
          </div>
          <div className="sidebar-footer"><span className="privacy-lock"><CheckCircle2 aria-hidden="true" /> Demo UID session · sample data only</span><span>HOSTEL NEXUS · 2026</span></div>
        </aside>

        <div className="workspace-main">
          <div className="welcome-row">
            <div><div className="eyebrow"><span className="eyebrow-dot" /> WING 4B · COMMUNITY SPACE</div><h1>{section === "dashboard" ? <>A good day to share, <span>{firstName}.</span></> : navigation.find((item) => item.id === section)?.label}</h1>
              <p>{section === "dashboard" ? "The essentials for making this place feel like yours." : section === "bookings" ? "Your upcoming plans and the occasional change of heart." : section === "log" ? "One shared record of what’s been booked and released." : "A local AI with hostel-level street smarts."}</p>
            </div>
            <div className="welcome-date"><CalendarDays aria-hidden="true" /><span><small>TODAY</small>{new Date(`${data.date}T12:00:00`).toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" })}</span></div>
          </div>

          <div className="mobile-nav" aria-label="Hostel sections">
            {navigation.map(({ id, label, icon: Icon }) => (
              <button key={id} type="button" className={section === id ? "is-current" : ""} onClick={() => setSection(id)} aria-pressed={section === id}><Icon aria-hidden="true" /><span>{label}</span></button>
            ))}
          </div>

          {section === "dashboard" && (
            <>
              <section className="welcome-banner" aria-label="Welcome to Hostel Nexus">
                <div className="banner-copy"><span className="banner-kicker"><DoorOpen aria-hidden="true" /> A PLACE TO LAND</span><h2>Make room for<br />the good stuff.</h2><p>Courts, gear, and a little less “who booked that?”</p><button className="banner-link" type="button" onClick={() => document.getElementById("booking-panel")?.scrollIntoView({ behavior: "smooth", block: "start" })}>Find your next hour <ArrowUpRight aria-hidden="true" /></button></div>
                <div className="banner-art" aria-hidden="true"><span className="art-ring ring-one" /><span className="art-ring ring-two" /><span className="art-dot dot-one" /><span className="art-dot dot-two" /><span className="art-caption">WING<br />4B</span><div className="art-building"><div className="building-roof" /><div className="building-face"><span /><span /><span /><span /><span /><span /><span /><span /><span /></div><div className="building-door" /></div><div className="art-ground" /></div>
              </section>

              <div className="overview-grid">
                <div className="overview-stat"><span className="stat-icon amber"><Sparkles aria-hidden="true" /></span><div><small>WEEKLY CREDITS</small><strong>{data.profile.credits}<span> / 4</span></strong><p>One for each reservation</p></div><span className="stat-detail">{data.profile.credits === 4 ? "FRESH START" : `${4 - data.profile.credits} USED`}</span></div>
                <div className="overview-stat"><span className="stat-icon green"><CalendarDays aria-hidden="true" /></span><div><small>YOUR ACTIVE BOOKINGS</small><strong>{activeBookings.toString().padStart(2, "0")}</strong><p>Cancel to free a credit</p></div><span className="stat-detail">MY PLANS</span></div>
                <div className="overview-stat"><span className="stat-icon blue"><UsersRound aria-hidden="true" /></span><div><small>COMMUNITY SLOTS TODAY</small><strong>{occupiedToday.toString().padStart(2, "0")}</strong><p>Already claimed in Wing 4B</p></div><span className="stat-detail">SHARED</span></div>
              </div>

              <div id="booking-panel" className="booking-layout">
                <BookingPanel data={data} model={model} onBooked={refreshData} />
                <aside className="right-rail">
                  <section className="rail-card credit-card"><span className="section-kicker">YOUR UID</span><span className="uid-large">{data.profile.hostelUid}</span><p>This UID identifies your demo account. Your credits refresh every Monday.</p><div className="credit-dots" aria-label={`${data.profile.credits} of 4 credits remaining`}>{Array.from({ length: 4 }, (_, index) => <span key={index} className={index < data.profile.credits ? "is-filled" : ""} />)}</div><span className="rail-footnote">{data.profile.credits} of 4 credits left this week</span></section>
                  <section className="rail-card house-rules"><span className="section-kicker">THE SHORT VERSION</span><h3>Share the good stuff.</h3><ul><li><CheckCircle2 aria-hidden="true" /> A reservation uses one credit.</li><li><CheckCircle2 aria-hidden="true" /> Cancel any time to get it back.</li><li><CheckCircle2 aria-hidden="true" /> One active claim per resource and hour.</li></ul><button type="button" onClick={() => setSection("log")}>View community activity <ChevronRight aria-hidden="true" /></button></section>
                  <section className="rail-card local-ai-card"><span className="local-ai-icon"><BookOpen aria-hidden="true" /></span><div><strong>A little help from the local warden.</strong><p>Witty booking notes, written on your device with Ollama.</p></div><button type="button" onClick={() => setSection("companion")}>Meet your warden <ArrowUpRight aria-hidden="true" /></button></section>
                </aside>
              </div>
            </>
          )}
          {section === "bookings" && <MyBookings bookings={data.myBookings} onChanged={refreshData} />}
          {section === "log" && <WardenLog entries={data.logEntries} />}
          {section === "companion" && <OllamaCompanion name={data.user.name} onModelChange={setModel} />}

          <footer className="main-footer"><span>Made for the little things that make a house.</span><span><span className="footer-dot" /> ALL SYSTEMS LOCAL-READY</span></footer>
        </div>
      </div>
    </main>
  );
}
