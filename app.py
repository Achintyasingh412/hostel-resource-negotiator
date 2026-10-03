# ╔══════════════════════════════════════════════════════════════════════════════╗
# ║  Smart Hostel Resource & Court Conflict Negotiator  v3.0                   ║
# ║  Author  : Achintya Singh                                                   ║
# ║  Engine  : Streamlit + Ollama (local AI) — 100 % offline & private         ║
# ║  Storage : Local JSON (data.json)                                           ║
# ╚══════════════════════════════════════════════════════════════════════════════╝

import streamlit as st
import json
import datetime
import random
from pathlib import Path

# ── Optional Ollama — graceful offline fallback ────────────────────────────────
try:
    import ollama
    OLLAMA_AVAILABLE = True
except ImportError:
    OLLAMA_AVAILABLE = False

# ══════════════════════════════════════════════════════════════════════════════
#  PAGE CONFIG  (must be first Streamlit call)
# ══════════════════════════════════════════════════════════════════════════════
st.set_page_config(
    page_title="Hostel Nexus",
    page_icon="🏠",
    layout="wide",
    initial_sidebar_state="collapsed",
)

# ══════════════════════════════════════════════════════════════════════════════
#  CONSTANTS
# ══════════════════════════════════════════════════════════════════════════════
DATA_FILE   = Path(__file__).parent / "data.json"
MAX_CREDITS = 4
AI_MODEL    = "llama3.2"   # swap to "gemma", "phi3", "mistral", etc.

TIME_SLOTS = [
    "05:00 PM – 06:00 PM",
    "06:00 PM – 07:00 PM",
    "07:00 PM – 08:00 PM",
    "08:00 PM – 09:00 PM",
    "09:00 PM – 10:00 PM",
    "10:00 PM – 11:00 PM",
]

# ── Updated resource catalog (sports & entertainment gear) ─────────────────────
RESOURCES = [
    "🏓 Table Tennis Racket #1",
    "🏓 Table Tennis Racket #2",
    "🏸 Badminton Court A",
    "🏸 Badminton Court B",
    "🏀 Basketball & Hoop",
    "🔊 Bluetooth Music Speaker",
]

# ── Offline warden fallback quotes ─────────────────────────────────────────────
WARDEN_FALLBACKS = [
    "Son, the AI server's resting — but the rules aren't. Return equipment on time or prepare for a very passive-aggressive notice on the whiteboard.",
    "Ollama took a gap semester. You booked it. You own it. Return it spotless.",
    "Offline warden mode activated. Treat that gear like your CGPA: with extreme care.",
    "My AI brain is on chai break. Just don't be the guy who leaves the speaker playing at 1 AM.",
    "No AI, but plenty of consequences. Return the equipment on time. That's the deal.",
]

# ── AI companion system persona ────────────────────────────────────────────────
CHAT_SYSTEM_PROMPT = (
    "You are a witty, street-smart AI companion living in the hostel block of Wing 4B. "
    "You've seen everything — midnight Maggi runs, racket drama, WiFi wars, and the "
    "legendary basketball court disputes of 2024. Help students with casual banter, "
    "late-night food recommendations, study hacks, hostel rules, settling roommate "
    "disputes, or just idle chat. Keep replies short, punchy, and lightly humorous. "
    "Never break character. You are a hostel resident, not a generic AI."
)

CHAT_OFFLINE_REPLIES = [
    "My brain's offline right now — ask the guy in Room 4B, he knows everything.",
    "Server's down. Like my motivation on Monday mornings. Back soon.",
    "Ollama went for chai. Classic. Try me again in a minute.",
    "I'd answer, but apparently I need electricity to exist. Wild concept.",
]


# ══════════════════════════════════════════════════════════════════════════════
#  HIGH-CONTRAST CSS — Deep Slate Navy Dark Mode
# ══════════════════════════════════════════════════════════════════════════════
def inject_css() -> None:
    st.markdown("""
    <style>
    /* ── Google Font ─────────────────────────────────────── */
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');

    *, *::before, *::after { box-sizing: border-box; margin: 0; }

    html, body, [class*="css"] {
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif !important;
    }

    /* ── App shell ───────────────────────────────────────── */
    .stApp {
        background-color: #0a0e17 !important;
        color: #ffffff !important;
    }
    #MainMenu, footer, header { visibility: hidden !important; }
    .block-container {
        padding-top: 1.4rem !important;
        padding-bottom: 2.5rem !important;
        max-width: 1340px !important;
    }
    section[data-testid="stSidebar"] { display: none !important; }

    /* ── Base text reset ──────────────────────────────────── */
    p, span, div, li, td, th, small {
        color: inherit;
    }

    /* ─────────────────────────────────────────────────────── */
    /*  CARD COMPONENT                                         */
    /* ─────────────────────────────────────────────────────── */
    .nx-card {
        background: #111827;
        border: 1px solid #374151;
        border-radius: 14px;
        padding: 1.5rem 1.7rem;
        margin-bottom: 1rem;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.55);
        transition: border-color .2s ease, box-shadow .2s ease;
    }
    .nx-card:hover {
        border-color: #4b5563;
        box-shadow: 0 6px 30px rgba(34, 197, 94, 0.07);
    }

    /* ─────────────────────────────────────────────────────── */
    /*  LOGIN CARD                                             */
    /* ─────────────────────────────────────────────────────── */
    .nx-login {
        background: #111827;
        border: 1px solid #374151;
        border-radius: 20px;
        padding: 3rem 2.6rem;
        max-width: 460px;
        margin: 6vh auto 0 auto;
        box-shadow: 0 12px 60px rgba(0, 0, 0, 0.75);
    }
    .nx-login-title {
        text-align: center;
        font-size: 1.45rem;
        font-weight: 800;
        color: #ffffff;
        margin-bottom: .25rem;
    }
    .nx-login-sub {
        text-align: center;
        font-size: .88rem;
        color: #d1d5db;
        margin-bottom: 1.8rem;
    }

    /* ─────────────────────────────────────────────────────── */
    /*  SECTION HEADERS                                        */
    /* ─────────────────────────────────────────────────────── */
    .nx-hdr {
        font-size: 1rem;
        font-weight: 800;
        color: #ffffff;
        letter-spacing: .2px;
        border-left: 3px solid #22c55e;
        padding-left: .7rem;
        margin: 1.6rem 0 1rem 0;
        line-height: 1.5;
    }

    /* ─────────────────────────────────────────────────────── */
    /*  STATUS BADGES                                          */
    /* ─────────────────────────────────────────────────────── */
    .badge-free {
        display: inline-flex; align-items: center; gap: 4px;
        background: rgba(34, 197, 94, 0.18);
        color: #4ade80;
        border: 1px solid rgba(34, 197, 94, 0.50);
        border-radius: 30px;
        padding: 3px 12px;
        font-size: .73rem;
        font-weight: 700;
        letter-spacing: .4px;
    }
    .badge-taken {
        display: inline-flex; align-items: center; gap: 4px;
        background: rgba(239, 68, 68, 0.18);
        color: #f87171;
        border: 1px solid rgba(239, 68, 68, 0.50);
        border-radius: 30px;
        padding: 3px 12px;
        font-size: .73rem;
        font-weight: 700;
        letter-spacing: .4px;
    }
    .badge-mine {
        display: inline-flex; align-items: center; gap: 4px;
        background: rgba(245, 158, 11, 0.18);
        color: #fbbf24;
        border: 1px solid rgba(245, 158, 11, 0.50);
        border-radius: 30px;
        padding: 3px 12px;
        font-size: .73rem;
        font-weight: 700;
        letter-spacing: .4px;
    }

    /* ─────────────────────────────────────────────────────── */
    /*  METRIC CARDS                                           */
    /* ─────────────────────────────────────────────────────── */
    .nx-metric {
        background: #111827;
        border: 1px solid #374151;
        border-radius: 14px;
        padding: 1.2rem 1rem;
        text-align: center;
    }
    .nx-metric-val {
        font-size: 2.6rem;
        font-weight: 800;
        line-height: 1;
        color: #f59e0b;
    }
    .nx-metric-lbl {
        font-size: .76rem;
        color: #d1d5db;
        text-transform: uppercase;
        letter-spacing: .7px;
        margin-top: .4rem;
        font-weight: 600;
    }

    /* ─────────────────────────────────────────────────────── */
    /*  TOP BAR                                                */
    /* ─────────────────────────────────────────────────────── */
    .nx-topbar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        background: #111827;
        border: 1px solid #374151;
        border-radius: 14px;
        padding: .9rem 1.6rem;
        margin-bottom: 1.3rem;
    }
    .nx-topbar-title {
        font-size: 1.25rem;
        font-weight: 800;
        color: #ffffff;
        letter-spacing: -.2px;
    }
    .nx-user-pill {
        display: inline-block;
        background: rgba(34, 197, 94, 0.15);
        color: #4ade80;
        border: 1px solid rgba(34, 197, 94, 0.45);
        border-radius: 30px;
        padding: 5px 18px;
        font-size: .84rem;
        font-weight: 700;
        white-space: nowrap;
    }

    /* ─────────────────────────────────────────────────────── */
    /*  CREDIT DOTS                                            */
    /* ─────────────────────────────────────────────────────── */
    .nx-dots {
        display: flex; gap: .45rem; justify-content: center; margin: .3rem 0;
    }
    .dot-on  {
        width: 14px; height: 14px; border-radius: 50%;
        background: #f59e0b;
        box-shadow: 0 0 8px rgba(245, 158, 11, 0.7);
    }
    .dot-off {
        width: 14px; height: 14px; border-radius: 50%;
        background: #374151;
    }

    /* ─────────────────────────────────────────────────────── */
    /*  WARDEN LOG ENTRIES                                     */
    /* ─────────────────────────────────────────────────────── */
    .nx-log {
        background: #111827;
        border-left: 3px solid #22c55e;
        border-radius: 0 10px 10px 0;
        padding: .75rem 1.1rem;
        margin-bottom: .6rem;
        font-size: .87rem;
    }
    .nx-log-ts {
        color: #6b7280;
        font-size: .76rem;
        margin-bottom: .2rem;
        font-weight: 500;
    }
    .nx-log-cancel { border-left-color: #ef4444 !important; }

    /* ─────────────────────────────────────────────────────── */
    /*  MATRIX TABLE ROW                                       */
    /* ─────────────────────────────────────────────────────── */
    .mx-res-label {
        font-size: .84rem;
        font-weight: 700;
        color: #ffffff;
        padding: .25rem 0;
    }
    .mx-col-hdr {
        font-size: .71rem;
        font-weight: 700;
        color: #d1d5db;
        letter-spacing: .3px;
        padding: .2rem 0;
    }

    /* ─────────────────────────────────────────────────────── */
    /*  STREAMLIT WIDGET OVERRIDES                             */
    /* ─────────────────────────────────────────────────────── */

    /* ── Tabs ── */
    div[data-testid="stTabs"] button[role="tab"] {
        background: #111827 !important;
        color: #d1d5db !important;
        font-weight: 700 !important;
        font-size: .88rem !important;
        border-radius: 8px 8px 0 0 !important;
        padding: .55rem 1.1rem !important;
    }
    div[data-testid="stTabs"] button[aria-selected="true"] {
        color: #4ade80 !important;
        border-bottom: 2px solid #22c55e !important;
        background: #0a0e17 !important;
    }
    div[data-testid="stTabsContent"] {
        border-top: 1px solid #374151;
        padding-top: 1rem;
    }

    /* ── Text inputs ── */
    .stTextInput > div > div > input {
        background: #0a0e17 !important;
        border: 1.5px solid #374151 !important;
        border-radius: 10px !important;
        color: #ffffff !important;
        font-size: .92rem !important;
        font-weight: 500 !important;
        padding: .55rem .9rem !important;
    }
    .stTextInput > div > div > input:focus {
        border-color: #22c55e !important;
        box-shadow: 0 0 0 2px rgba(34, 197, 94, 0.25) !important;
        outline: none !important;
    }
    .stTextInput > div > div > input::placeholder {
        color: #6b7280 !important;
    }
    /* Input labels */
    .stTextInput label,
    .stSelectbox label,
    .stTextArea label,
    .stNumberInput label {
        color: #d1d5db !important;
        font-weight: 700 !important;
        font-size: .86rem !important;
        letter-spacing: .2px !important;
    }

    /* ── Selectboxes ── */
    .stSelectbox > div > div {
        background: #0a0e17 !important;
        border: 1.5px solid #374151 !important;
        border-radius: 10px !important;
        color: #ffffff !important;
        font-size: .92rem !important;
        font-weight: 500 !important;
    }
    .stSelectbox > div > div:focus-within {
        border-color: #22c55e !important;
        box-shadow: 0 0 0 2px rgba(34, 197, 94, 0.25) !important;
    }
    /* Dropdown option text */
    [data-baseweb="select"] * { color: #ffffff !important; }
    [data-baseweb="popover"] { background: #111827 !important; }
    [data-baseweb="menu"] { background: #111827 !important; border: 1px solid #374151 !important; }
    [role="option"] { color: #ffffff !important; background: #111827 !important; }
    [role="option"]:hover { background: #1f2937 !important; }

    /* ── Buttons ── */
    .stButton > button {
        border-radius: 10px !important;
        font-weight: 700 !important;
        font-size: .88rem !important;
        transition: all .15s ease !important;
        background: #1f2937 !important;
        border: 1px solid #374151 !important;
        color: #ffffff !important;
        padding: .5rem 1rem !important;
    }
    .stButton > button:hover {
        background: #374151 !important;
        border-color: #4b5563 !important;
        transform: translateY(-1px) !important;
        box-shadow: 0 4px 14px rgba(0,0,0,0.45) !important;
    }
    .stButton > button[kind="primary"] {
        background: #16a34a !important;
        border-color: #15803d !important;
        color: #ffffff !important;
    }
    .stButton > button[kind="primary"]:hover {
        background: #15803d !important;
        box-shadow: 0 4px 18px rgba(34,197,94,0.35) !important;
    }
    .stButton > button:disabled {
        background: #1a1f2e !important;
        border-color: #2d3748 !important;
        color: #4b5563 !important;
        cursor: not-allowed !important;
        transform: none !important;
    }

    /* ── Alerts ── */
    div[data-testid="stAlert"] {
        border-radius: 10px !important;
        font-size: .88rem !important;
        font-weight: 500 !important;
        border-width: 1px !important;
    }
    div[data-testid="stAlert"] p { color: inherit !important; }

    /* ── Expander ── */
    details > summary {
        background: #1f2937 !important;
        color: #d1d5db !important;
        border-radius: 8px !important;
        font-weight: 600 !important;
        font-size: .86rem !important;
        padding: .5rem .9rem !important;
    }
    details[open] > summary {
        border-radius: 8px 8px 0 0 !important;
        border-bottom: 1px solid #374151 !important;
    }

    /* ── Chat elements ── */
    div[data-testid="stChatMessage"] {
        background: #111827 !important;
        border: 1px solid #374151 !important;
        border-radius: 14px !important;
        padding: .9rem 1.1rem !important;
        margin-bottom: .6rem !important;
    }
    div[data-testid="stChatMessage"] p {
        color: #ffffff !important;
        font-size: .9rem !important;
        line-height: 1.6 !important;
    }
    div[data-testid="stChatInputContainer"] {
        background: #111827 !important;
        border: 1.5px solid #374151 !important;
        border-radius: 12px !important;
    }
    div[data-testid="stChatInputContainer"]:focus-within {
        border-color: #22c55e !important;
        box-shadow: 0 0 0 2px rgba(34,197,94,0.2) !important;
    }
    div[data-testid="stChatInputContainer"] textarea {
        background: transparent !important;
        color: #ffffff !important;
        font-size: .9rem !important;
    }
    div[data-testid="stChatInputContainer"] textarea::placeholder {
        color: #6b7280 !important;
    }

    /* ── Metric widget ── */
    [data-testid="stMetric"] label {
        color: #d1d5db !important;
        font-size: .8rem !important;
        font-weight: 700 !important;
    }
    [data-testid="stMetricValue"] > div {
        color: #f59e0b !important;
        font-weight: 800 !important;
    }

    /* ── Dividers ── */
    hr {
        border: none !important;
        border-top: 1px solid #374151 !important;
        margin: .8rem 0 !important;
    }

    /* ── Scrollbar ── */
    ::-webkit-scrollbar { width: 6px; height: 6px; }
    ::-webkit-scrollbar-track { background: #0a0e17; }
    ::-webkit-scrollbar-thumb { background: #374151; border-radius: 3px; }
    ::-webkit-scrollbar-thumb:hover { background: #4b5563; }
    </style>
    """, unsafe_allow_html=True)


# ══════════════════════════════════════════════════════════════════════════════
#  DATA LAYER — Load / Save JSON
# ══════════════════════════════════════════════════════════════════════════════
def load_data() -> dict:
    if DATA_FILE.exists():
        with open(DATA_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    # First-run seed
    seed = {
        "users": {
            "HOSTEL-01": {"name": "Achintya Singh", "passcode": "1234", "credits": 4, "joined": "2026-10-03"},
            "HOSTEL-02": {"name": "Puran",          "passcode": "2345", "credits": 4, "joined": "2026-10-03"},
            "HOSTEL-03": {"name": "Rahul Verma",    "passcode": "3456", "credits": 4, "joined": "2026-10-03"},
            "HOSTEL-04": {"name": "Priya Sharma",   "passcode": "4567", "credits": 4, "joined": "2026-10-03"},
            "HOSTEL-05": {"name": "Karan Mehta",    "passcode": "5678", "credits": 4, "joined": "2026-10-03"},
        },
        "bookings":   [],
        "warden_log": [],
    }
    save_data(seed)
    return seed


def save_data(data: dict) -> None:
    with open(DATA_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)


def ts() -> str:
    return datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")


def push_log(data: dict, event: str, uid: str, name: str,
             resource: str, slot: str, note: str) -> None:
    """Append a permanent, immutable log entry and persist."""
    data["warden_log"].insert(0, {
        "ts":       ts(),
        "event":    event,
        "uid":      uid,
        "name":     name,
        "resource": resource,
        "slot":     slot,
        "note":     note,
    })
    save_data(data)


# ══════════════════════════════════════════════════════════════════════════════
#  BOOKING LOGIC
# ══════════════════════════════════════════════════════════════════════════════
def get_slot(data: dict, resource: str, slot: str) -> dict | None:
    return next(
        (b for b in data["bookings"] if b["resource"] == resource and b["slot"] == slot),
        None,
    )


def book_slot(data: dict, uid: str, resource: str, slot: str, note: str) -> dict:
    bid = f"BK-{datetime.datetime.now().strftime('%Y%m%d%H%M%S')}-{uid}"
    data["bookings"].append({
        "id":          bid,
        "uid":         uid,
        "name":        data["users"][uid]["name"],
        "resource":    resource,
        "slot":        slot,
        "booked_at":   ts(),
        "warden_note": note,
    })
    data["users"][uid]["credits"] = max(0, data["users"][uid]["credits"] - 1)
    push_log(data, "BOOKING", uid, data["users"][uid]["name"], resource, slot, note)
    return data


def cancel_slot(data: dict, booking_id: str, uid: str) -> tuple[dict, bool, dict | None]:
    removed = next((b for b in data["bookings"] if b["id"] == booking_id and b["uid"] == uid), None)
    if not removed:
        return data, False, None
    data["bookings"] = [b for b in data["bookings"] if b["id"] != booking_id]
    data["users"][uid]["credits"] = min(MAX_CREDITS, data["users"][uid]["credits"] + 1)
    push_log(data, "CANCELLATION", uid, data["users"][uid]["name"],
             removed["resource"], removed["slot"],
             f"Slot released voluntarily. 1 credit refunded. (ref {booking_id})")
    return data, True, removed


# ══════════════════════════════════════════════════════════════════════════════
#  AI ENGINE — Ollama with offline fallback
# ══════════════════════════════════════════════════════════════════════════════
def warden_note(user_name: str, resource: str, slot: str) -> str:
    if not OLLAMA_AVAILABLE:
        return "⚠️ **Warden (Offline):** " + random.choice(WARDEN_FALLBACKS)
    prompt = (
        f"{user_name} booked '{resource}' for '{slot}'. "
        "Write a short (max 2 sentences), witty, strict hostel-warden confirmation "
        "with one usage tip and one mild return-on-time warning. No emojis."
    )
    try:
        r = ollama.chat(
            model=AI_MODEL,
            messages=[
                {"role": "system",
                 "content": (
                     "You are a strict but dry-humoured Hostel Warden at an Indian "
                     "engineering college. Brief, authoritative, max 55 words."
                 )},
                {"role": "user", "content": prompt},
            ],
        )
        return "🤖 **Warden:** " + r["message"]["content"].strip()
    except Exception:
        return "⚠️ **Warden (Offline):** " + random.choice(WARDEN_FALLBACKS)


def conflict_note(requester: str, booker: str, resource: str, slot: str) -> str:
    if not OLLAMA_AVAILABLE:
        return (f"⚖️ **Ruling:** {booker} got here first. "
                f"{requester}, pick another slot — first-come, first-served.")
    try:
        r = ollama.chat(
            model=AI_MODEL,
            messages=[
                {"role": "system", "content": "Fair, decisive Hostel Warden. Max 40 words."},
                {"role": "user",
                 "content": (
                     f"{requester} wants '{resource}' at '{slot}' but {booker} already has it. "
                     "Give a one-sentence fair ruling and suggest they pick another slot or time."
                 )},
            ],
        )
        return "⚖️ **Warden Ruling:** " + r["message"]["content"].strip()
    except Exception:
        return (f"⚖️ **Ruling:** {booker} booked first. "
                f"{requester}, choose a different slot or resource.")


def companion_reply(history: list[dict]) -> str:
    if not OLLAMA_AVAILABLE:
        return random.choice(CHAT_OFFLINE_REPLIES)
    try:
        msgs = [{"role": "system", "content": CHAT_SYSTEM_PROMPT}] + history
        r = ollama.chat(model=AI_MODEL, messages=msgs)
        return r["message"]["content"].strip()
    except Exception:
        return "I'm having a moment. Ollama might be asleep — try again in a bit."


# ══════════════════════════════════════════════════════════════════════════════
#  SHARED UI HELPERS
# ══════════════════════════════════════════════════════════════════════════════
def txt(content: str, color: str = "#ffffff", size: str = ".9rem",
        weight: str = "400", margin: str = ".1rem 0") -> str:
    """Quick inline-styled paragraph."""
    return (f'<p style="color:{color};font-size:{size};'
            f'font-weight:{weight};margin:{margin};line-height:1.55">{content}</p>')


def metric_card(val, label: str, color: str = "#f59e0b") -> str:
    return (f'<div class="nx-metric">'
            f'<div class="nx-metric-val" style="color:{color}">{val}</div>'
            f'<div class="nx-metric-lbl">{label}</div></div>')


def credit_dots(credits_left: int, align: str = "center") -> str:
    dots = "".join(
        '<div class="dot-on"></div>' if i < credits_left
        else '<div class="dot-off"></div>'
        for i in range(MAX_CREDITS)
    )
    return (f'<div class="nx-dots" style="justify-content:{align}">{dots}</div>')


# ══════════════════════════════════════════════════════════════════════════════
#  TOP BAR
# ══════════════════════════════════════════════════════════════════════════════
def render_topbar(uid: str, name: str, credits_left: int) -> None:
    c1, c2, c3 = st.columns([5, 3, 2])
    with c1:
        st.markdown(
            '<div class="nx-topbar-title">🏠 Hostel Nexus</div>',
            unsafe_allow_html=True,
        )
    with c2:
        st.markdown(
            f'<div style="text-align:center">'
            f'{credit_dots(credits_left)}'
            f'<div style="color:#d1d5db;font-size:.76rem;font-weight:600;margin-top:.2rem">'
            f'Credits: <strong style="color:#f59e0b">{credits_left} / {MAX_CREDITS}</strong></div>'
            f'</div>',
            unsafe_allow_html=True,
        )
    with c3:
        st.markdown(
            f'<div class="nx-user-pill" style="text-align:center;margin-bottom:.4rem">'
            f'👤 {name} &nbsp;|&nbsp; {uid}</div>',
            unsafe_allow_html=True,
        )
        if st.button("🚪 Logout", key="logout_btn", use_container_width=True):
            for k in list(st.session_state.keys()):
                del st.session_state[k]
            st.rerun()


# ══════════════════════════════════════════════════════════════════════════════
#  LOGIN PAGE
# ══════════════════════════════════════════════════════════════════════════════
def render_login(data: dict) -> None:
    st.markdown(
        '<h1 style="text-align:center;color:#4ade80;font-size:3.4rem;'
        'margin-top:2rem;margin-bottom:.3rem">🏠</h1>'
        '<h2 style="text-align:center;color:#ffffff;font-weight:800;'
        'font-size:1.9rem;margin-bottom:.2rem">Hostel Nexus</h2>'
        '<p style="text-align:center;color:#d1d5db;font-size:.95rem;margin-bottom:2.5rem">'
        'Smart Resource &amp; Court Conflict Negotiator</p>',
        unsafe_allow_html=True,
    )

    _, col, _ = st.columns([1, 2, 1])
    with col:
        st.markdown('<div class="nx-login">', unsafe_allow_html=True)
        st.markdown(
            '<p class="nx-login-title">Sign In</p>'
            '<p class="nx-login-sub">Enter your hostel UID and 4-digit passcode</p>',
            unsafe_allow_html=True,
        )
        uid_in  = st.text_input("Hostel UID",  placeholder="e.g.  HOSTEL-01", key="l_uid").strip().upper()
        pass_in = st.text_input("Passcode",     placeholder="••••", type="password", key="l_pass").strip()
        st.markdown("<br>", unsafe_allow_html=True)

        if st.button("🔑  Sign In", use_container_width=True, type="primary"):
            if uid_in in data["users"]:
                if data["users"][uid_in]["passcode"] == pass_in:
                    st.session_state.update({
                        "auth": True,
                        "uid":  uid_in,
                        "name": data["users"][uid_in]["name"],
                        "chat": [],
                    })
                    st.rerun()
                else:
                    st.error("❌  Incorrect passcode. Please try again.")
            else:
                st.error("❌  UID not found. Check your credentials.")

        st.markdown("</div>", unsafe_allow_html=True)

    st.markdown(
        '<hr style="margin-top:2rem"/>'
        '<p style="text-align:center;color:#4b5563;font-size:.78rem;margin-top:.6rem">'
        'Demo accounts &nbsp;→&nbsp; HOSTEL-01 / 1234 &nbsp;·&nbsp; '
        'HOSTEL-02 / 2345 &nbsp;·&nbsp; HOSTEL-03 / 3456</p>',
        unsafe_allow_html=True,
    )


# ══════════════════════════════════════════════════════════════════════════════
#  TAB 1 — DASHBOARD & SLOT MATRIX
# ══════════════════════════════════════════════════════════════════════════════
def render_dashboard(data: dict, uid: str) -> dict:
    st.markdown('<div class="nx-hdr">📅 Book a Slot</div>', unsafe_allow_html=True)

    c_res, c_slot = st.columns(2)
    with c_res:
        sel_res  = st.selectbox("Resource / Equipment", RESOURCES, key="sel_res")
    with c_slot:
        sel_slot = st.selectbox("Time Slot (5 PM – 11 PM)", TIME_SLOTS, key="sel_slot")

    credits_left = data["users"][uid]["credits"]
    existing     = get_slot(data, sel_res, sel_slot)

    # ── Booking card ───────────────────────────────────────────────────────
    st.markdown('<div class="nx-card">', unsafe_allow_html=True)
    left_col, right_col = st.columns([3, 2])

    with left_col:
        st.markdown(
            txt(sel_res, "#ffffff", "1.05rem", "700", ".0rem") +
            txt(f"🕐 {sel_slot}", "#d1d5db", ".88rem", "500", ".25rem"),
            unsafe_allow_html=True,
        )
        if existing:
            is_mine = existing["uid"] == uid
            if is_mine:
                st.markdown('<span class="badge-mine">🟡 YOUR BOOKING</span>',
                            unsafe_allow_html=True)
            else:
                st.markdown('<span class="badge-taken">🔴 BOOKED</span>',
                            unsafe_allow_html=True)
                st.markdown(
                    txt(f'By <strong style="color:#ffffff">{existing["name"]}</strong>'
                        f' ({existing["uid"]}) &nbsp;·&nbsp; {existing["booked_at"]}',
                        "#9ca3af", ".82rem", "400", ".4rem"),
                    unsafe_allow_html=True,
                )
        else:
            st.markdown('<span class="badge-free">🟢 AVAILABLE</span>',
                        unsafe_allow_html=True)

    with right_col:
        if existing:
            if existing["uid"] == uid:
                st.info("✅ This slot is already yours.")
            else:
                note_txt = conflict_note(
                    data["users"][uid]["name"], existing["name"],
                    sel_res, sel_slot,
                )
                st.warning(note_txt)
        else:
            if credits_left <= 0:
                st.error("⛔ No credits left this week. Cancel a booking to free one up.")
            else:
                st.markdown(
                    txt(f"1 credit will be deducted &nbsp;|&nbsp; "
                        f"<strong style='color:#f59e0b'>{credits_left}</strong> remaining",
                        "#9ca3af", ".82rem", "400", ".0rem"),
                    unsafe_allow_html=True,
                )
                if st.button("✅ Claim This Slot", type="primary",
                             use_container_width=True, key="claim_btn"):
                    with st.spinner("🤖 Warden reviewing your request…"):
                        note = warden_note(data["users"][uid]["name"], sel_res, sel_slot)
                    data = book_slot(data, uid, sel_res, sel_slot, note)
                    st.session_state["_flash_note"] = note
                    st.session_state["_flash_slot"] = f"{sel_res}  ·  {sel_slot}"
                    st.toast("✅ Slot booked successfully!", icon="🏠")
                    st.rerun()

    st.markdown("</div>", unsafe_allow_html=True)

    # ── One-render confirmation banner ─────────────────────────────────────
    if "_flash_note" in st.session_state:
        slot_txt = st.session_state.pop("_flash_slot", "")
        note_txt = st.session_state.pop("_flash_note", "")
        st.success(f"**Booking Confirmed:** {slot_txt}\n\n{note_txt}")

    # ── Live Booking Matrix ────────────────────────────────────────────────
    st.markdown('<div class="nx-hdr">🗓️ Live Booking Matrix</div>', unsafe_allow_html=True)

    # Header row
    hdr = st.columns([3] + [2] * len(TIME_SLOTS))
    hdr[0].markdown('<p class="mx-col-hdr">RESOURCE</p>', unsafe_allow_html=True)
    for i, s in enumerate(TIME_SLOTS):
        hdr[i + 1].markdown(f'<p class="mx-col-hdr">{s}</p>', unsafe_allow_html=True)

    st.markdown("<hr>", unsafe_allow_html=True)

    for res in RESOURCES:
        row = st.columns([3] + [2] * len(TIME_SLOTS))
        row[0].markdown(f'<p class="mx-res-label">{res}</p>', unsafe_allow_html=True)
        for i, slot in enumerate(TIME_SLOTS):
            s = get_slot(data, res, slot)
            with row[i + 1]:
                if s:
                    if s["uid"] == uid:
                        st.markdown('<span class="badge-mine">MINE</span>',
                                    unsafe_allow_html=True)
                    else:
                        st.markdown('<span class="badge-taken">TAKEN</span>',
                                    unsafe_allow_html=True)
                else:
                    st.markdown('<span class="badge-free">FREE</span>',
                                unsafe_allow_html=True)

    return data


# ══════════════════════════════════════════════════════════════════════════════
#  TAB 2 — MY BOOKINGS & PROFILE
# ══════════════════════════════════════════════════════════════════════════════
def render_profile(data: dict, uid: str) -> dict:
    user         = data["users"][uid]
    credits_left = user["credits"]
    my_bookings  = [b for b in data["bookings"] if b["uid"] == uid]
    all_time_bk  = sum(1 for e in data["warden_log"]
                       if e.get("uid") == uid and e.get("event") == "BOOKING")

    # ── Stats row ──────────────────────────────────────────────────────────
    m1, m2, m3, m4 = st.columns(4)
    m1.markdown(metric_card(credits_left,              "Credits Left",    "#f59e0b"), unsafe_allow_html=True)
    m2.markdown(metric_card(len(my_bookings),           "Active Bookings", "#4ade80"), unsafe_allow_html=True)
    m3.markdown(metric_card(MAX_CREDITS - credits_left, "Credits Used",    "#f87171"), unsafe_allow_html=True)
    m4.markdown(metric_card(all_time_bk,                "All-Time Booked", "#94a3b8"), unsafe_allow_html=True)

    st.markdown("<br>", unsafe_allow_html=True)

    left_col, right_col = st.columns([2, 3])

    # ── Profile card ───────────────────────────────────────────────────────
    with left_col:
        st.markdown('<div class="nx-hdr">👤 Profile</div>', unsafe_allow_html=True)
        st.markdown('<div class="nx-card">', unsafe_allow_html=True)
        st.markdown(
            txt(user["name"], "#ffffff", "1.1rem", "800", ".0rem") +
            txt(f'UID: <code style="color:#4ade80;background:#0a0e17;'
                f'padding:2px 8px;border-radius:5px;font-size:.82rem">{uid}</code>',
                "#d1d5db", ".86rem", "500", ".35rem") +
            txt(f'Member since: {user.get("joined", "—")}', "#9ca3af", ".83rem"),
            unsafe_allow_html=True,
        )
        st.markdown("<hr>", unsafe_allow_html=True)
        st.markdown(
            txt("Weekly Credits", "#d1d5db", ".78rem", "700", ".5rem 0 .35rem 0") +
            credit_dots(credits_left, "flex-start") +
            txt(f"{credits_left} of {MAX_CREDITS} remaining this week",
                "#9ca3af", ".78rem", "400", ".35rem 0 0 0"),
            unsafe_allow_html=True,
        )
        st.markdown("</div>", unsafe_allow_html=True)

    # ── Active bookings ────────────────────────────────────────────────────
    with right_col:
        st.markdown('<div class="nx-hdr">📋 Active Bookings</div>', unsafe_allow_html=True)

        if not my_bookings:
            st.markdown(
                '<div class="nx-card" style="text-align:center">' +
                txt("No active bookings yet.", "#d1d5db", ".92rem", "500") +
                txt("Head to <strong>Dashboard</strong> to claim a slot.",
                    "#9ca3af", ".84rem") +
                "</div>",
                unsafe_allow_html=True,
            )
        else:
            for bk in my_bookings:
                st.markdown('<div class="nx-card">', unsafe_allow_html=True)
                bc1, bc2 = st.columns([4, 2])
                with bc1:
                    st.markdown(
                        txt(bk["resource"], "#ffffff", ".96rem", "700", "0") +
                        txt(f'🕐 {bk["slot"]}', "#4ade80", ".86rem", "600", ".2rem") +
                        txt(f'Booked: {bk["booked_at"]}', "#9ca3af", ".78rem", "400", ".15rem"),
                        unsafe_allow_html=True,
                    )
                    if bk.get("warden_note"):
                        with st.expander("🤖 Warden's Note"):
                            st.markdown(
                                txt(bk["warden_note"], "#e5e7eb", ".88rem"),
                                unsafe_allow_html=True,
                            )
                with bc2:
                    if st.button("❌ Cancel & Refund",
                                 key=f"cancel_{bk['id']}",
                                 use_container_width=True):
                        data, ok, removed = cancel_slot(data, bk["id"], uid)
                        if ok:
                            st.toast(f"Cancelled: {removed['resource']}. Credit refunded!", icon="✅")
                            st.rerun()
                        else:
                            st.error("Could not cancel this booking.")
                st.markdown("</div>", unsafe_allow_html=True)

    return data


# ══════════════════════════════════════════════════════════════════════════════
#  TAB 3 — WARDEN LOG  (immutable — no clear buttons)
# ══════════════════════════════════════════════════════════════════════════════
def render_warden_log(data: dict) -> None:
    st.markdown('<div class="nx-hdr">📜 Transparent Activity Log</div>', unsafe_allow_html=True)

    # Info banner about immutability
    st.markdown(
        '<div class="nx-card" style="padding:1rem 1.4rem;margin-bottom:1rem">'
        '<p style="color:#fbbf24;font-weight:700;font-size:.86rem;margin:0 0 .2rem 0">'
        '🔒 Immutable Log — Full Transparency</p>'
        '<p style="color:#d1d5db;font-size:.82rem;margin:0">'
        'All booking and cancellation events are permanently recorded. '
        'Every roommate can see what has been booked or released. '
        'No entries can be deleted, ensuring fair and transparent resource sharing.'
        '</p></div>',
        unsafe_allow_html=True,
    )

    # Filter
    filt = st.selectbox(
        "Filter by event type",
        ["ALL EVENTS", "BOOKING", "CANCELLATION"],
        key="log_filt",
    )

    logs = data.get("warden_log", [])
    if filt != "ALL EVENTS":
        logs = [l for l in logs if l.get("event") == filt]

    if not logs:
        st.info("No log entries yet. Book a resource to see the log populate.")
        return

    for entry in logs:
        evt   = entry.get("event", "—")
        color = {"BOOKING": "#22c55e", "CANCELLATION": "#ef4444"}.get(evt, "#818cf8")
        icon  = {"BOOKING": "📌",      "CANCELLATION": "🗑️"}.get(evt, "📋")
        note  = entry.get("note", "")

        st.markdown(
            f'<div class="nx-log'
            f'{" nx-log-cancel" if evt == "CANCELLATION" else ""}"'
            f' style="border-left-color:{color}">'

            f'<div class="nx-log-ts">{entry.get("ts", "—")}'
            f'&nbsp;·&nbsp;<strong style="color:{color}">{icon} {evt}</strong></div>'

            f'<span style="color:#ffffff;font-weight:700;font-size:.9rem">'
            f'{entry.get("name", "?")}</span>'
            f'<span style="color:#6b7280;font-size:.84rem"> ({entry.get("uid", "?")})</span>'
            f'<span style="color:#9ca3af;font-size:.84rem"> → </span>'
            f'<span style="color:#e5e7eb;font-size:.88rem">{entry.get("resource", "—")}</span>'
            f'<span style="color:#4b5563;font-size:.84rem"> &nbsp;|&nbsp; </span>'
            f'<span style="color:#d1d5db;font-size:.84rem">{entry.get("slot", "—")}</span>'

            + (f'<div style="margin-top:.4rem;color:#9ca3af;font-size:.8rem;'
               f'line-height:1.5">{note[:200]}</div>' if note else "") +

            f'</div>',
            unsafe_allow_html=True,
        )

    # Summary metrics
    st.markdown("<hr>", unsafe_allow_html=True)
    total_b = sum(1 for e in data["warden_log"] if e.get("event") == "BOOKING")
    total_c = sum(1 for e in data["warden_log"] if e.get("event") == "CANCELLATION")
    s1, s2, s3 = st.columns(3)
    s1.metric("Total Bookings (All Time)", total_b)
    s2.metric("Total Cancellations",       total_c)
    s3.metric("Net Active Slots",          total_b - total_c)


# ══════════════════════════════════════════════════════════════════════════════
#  TAB 4 — AI SMALL-TALK COMPANION
# ══════════════════════════════════════════════════════════════════════════════
def render_ai_companion(uid: str, name: str) -> None:
    # ── Header banner ──────────────────────────────────────────────────────
    olm_color  = "#4ade80" if OLLAMA_AVAILABLE else "#f87171"
    olm_status = "🟢 Ollama Online" if OLLAMA_AVAILABLE else "🔴 Ollama Offline (fallback active)"

    st.markdown(
        '<div class="nx-card">'
        f'<div style="display:flex;align-items:center;justify-content:space-between;'
        f'flex-wrap:wrap;gap:.6rem">'
        f'<div>'
        f'<p style="color:#ffffff;font-size:1.1rem;font-weight:800;margin:0 0 .15rem 0">'
        f'🤖 Hostel AI Companion</p>'
        f'<p style="color:#d1d5db;font-size:.86rem;margin:0">'
        f'Your street-smart Wing 4B AI buddy. Casual chat, late-night food recs, '
        f'roommate dispute arbitration — anything goes.</p>'
        f'</div>'
        f'<span style="background:rgba(34,197,94,0.1);color:{olm_color};'
        f'border:1px solid {olm_color}40;border-radius:30px;'
        f'padding:4px 14px;font-size:.78rem;font-weight:700;white-space:nowrap">'
        f'{olm_status}</span>'
        f'</div></div>',
        unsafe_allow_html=True,
    )

    if not OLLAMA_AVAILABLE:
        st.warning(
            "⚠️ **Ollama not detected.** Install from [ollama.com](https://ollama.com), "
            "run `ollama pull llama3.2`, then restart the app. "
            "Fallback replies are active in the meantime.",
        )

    # ── Session state init ──────────────────────────────────────────────────
    if "chat" not in st.session_state:
        st.session_state["chat"] = []

    # ── Controls ───────────────────────────────────────────────────────────
    _, ctrl_col = st.columns([6, 2])
    with ctrl_col:
        if st.button("🧹 Clear Chat History", use_container_width=True):
            st.session_state["chat"] = []
            st.rerun()

    st.markdown("<br>", unsafe_allow_html=True)

    history: list[dict] = st.session_state["chat"]

    # ── Greeting (shown only when history is empty) ─────────────────────────
    if not history:
        with st.chat_message("assistant", avatar="🏠"):
            st.markdown(
                f"*Ayo {name}!* Welcome to Wing 4B AI. I'm basically the guy who's "
                "been here longer than the warden. Ask me anything — Maggi spots, "
                "TV remote diplomacy, study-night survival tips. What's up? 😎"
            )

    # ── Render history ──────────────────────────────────────────────────────
    for msg in history:
        avatar = "👤" if msg["role"] == "user" else "🏠"
        with st.chat_message(msg["role"], avatar=avatar):
            st.markdown(msg["content"])

    # ── Input ───────────────────────────────────────────────────────────────
    user_input = st.chat_input("Message the hostel AI…", key="companion_input")

    if user_input and user_input.strip():
        clean_input = user_input.strip()
        history.append({"role": "user", "content": clean_input})

        with st.chat_message("user", avatar="👤"):
            st.markdown(clean_input)

        with st.chat_message("assistant", avatar="🏠"):
            with st.spinner("Thinking…"):
                reply = companion_reply(history)
            st.markdown(reply)

        history.append({"role": "assistant", "content": reply})
        st.session_state["chat"] = history


# ══════════════════════════════════════════════════════════════════════════════
#  MAIN ENTRY POINT
# ══════════════════════════════════════════════════════════════════════════════
def main() -> None:
    inject_css()
    data = load_data()

    # ── Auth gate ──────────────────────────────────────────────────────────
    if not st.session_state.get("auth"):
        render_login(data)
        return

    uid  = st.session_state["uid"]
    name = st.session_state["name"]

    # Safety check
    if uid not in data["users"]:
        st.error("Session expired or UID not found. Please log in again.")
        for k in list(st.session_state.keys()):
            del st.session_state[k]
        st.rerun()
        return

    # ── Top bar ────────────────────────────────────────────────────────────
    render_topbar(uid, name, data["users"][uid]["credits"])

    # ── Navigation tabs ────────────────────────────────────────────────────
    tab1, tab2, tab3, tab4 = st.tabs([
        "🏠  Dashboard & Slots",
        "👤  My Bookings",
        "📜  Warden Log",
        "🤖  AI Companion",
    ])

    with tab1:
        data = render_dashboard(data, uid)

    with tab2:
        data = render_profile(data, uid)

    with tab3:
        render_warden_log(data)

    with tab4:
        render_ai_companion(uid, name)


if __name__ == "__main__":
    main()
