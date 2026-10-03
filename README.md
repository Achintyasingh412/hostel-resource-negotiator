# 🏠 Hostel Nexus — Smart Resource & Court Conflict Negotiator

> **A 100 % local, privacy-first web app** for college students and roommates to manage shared hostel resources — powered by Streamlit and local AI (Ollama). Zero cloud. Zero external APIs. Lightning fast.

---

## ✨ Features

| Feature | Details |
|---|---|
| 🔐 Secure Login | UID + 4-digit passcode via `st.session_state` — no cookies, no cloud |
| 💰 Weekly Credit Quota | 4 credits/week; −1 on booking, +1 on cancel (capped at 4) |
| 📅 Live Slot Matrix | Color-coded 5 PM–11 PM grid across 6 shared resources |
| 🤖 AI Hostel Warden | Ollama-powered witty booking confirmations + conflict rulings |
| 🤖 AI Companion Chat | Multi-turn small-talk chatbot — Maggi recs, hostel rules, vibe checks |
| 📜 Immutable Audit Log | Permanent, undeletable booking history for full roommate transparency |
| 🎨 Deep Vintage Dark UI | High-contrast `#0a0e17` navy + `#111827` card surfaces |

---

## 🎨 UI Palette — "Deep Slate Navy"

| Role | Color |
|---|---|
| App Background | `#0a0e17` |
| Card Surface | `#111827` |
| Card Border | `#374151` |
| Primary Text | `#ffffff` |
| Helper / Label Text | `#d1d5db` |
| Available Badge | `#4ade80` (emerald) |
| Booked Badge | `#f87171` (red) |
| My Slot Badge | `#fbbf24` (amber) |
| Credit Dots (active) | `#f59e0b` |
| Primary Button | `#16a34a` |

---

## 🏀 Shared Resources

| Resource | Type |
|---|---|
| 🏓 Table Tennis Racket #1 / #2 | Sports |
| 🏸 Badminton Court A / B | Sports |
| 🏀 Basketball & Hoop | Sports |
| 🔊 Bluetooth Music Speaker | Entertainment |

**Time Slots:** 5:00 PM → 11:00 PM in 1-hour windows (6 slots/resource/day)

---

## 💳 Credit System

| Action | Credit Change |
|---|---|
| Booking confirmed | −1 |
| Booking cancelled | +1 (max 4) |
| Credits reach 0 | All booking buttons disabled |

Credits reset manually via `data.json` (or future cron script) each Monday.

---

## 📜 Transparency & Audit Log

The **Warden Log** tab is **fully immutable**:
- Every booking and cancellation is permanently recorded.
- No user can delete or clear log entries.
- All roommates can see what everyone has booked — ensuring fair resource sharing.

---

## 🤖 Local AI Setup (Ollama)

> The app runs fully without Ollama — it uses witty offline fallback quotes automatically.
> Install Ollama for live AI warden commentary and the companion chatbot.

### 1 — Install Ollama
Download from [https://ollama.com](https://ollama.com) and run the installer.

### 2 — Pull a model
```bash
ollama pull llama3.2
# or
ollama pull gemma
```

### 3 — Start the server
```bash
ollama serve
```
Ollama listens on `http://localhost:11434` by default.

### 4 — Switch models in `app.py`
```python
AI_MODEL = "llama3.2"   # line ~33 — change to any pulled model
```

---

## 🚀 Quick Start

### Prerequisites
- Python 3.10 or higher
- (Optional) Ollama for AI features

### 1 — Clone the repository
```bash
git clone https://github.com/Achintyasingh412/hostel-resource-negotiator.git
cd hostel-resource-negotiator
```

### 2 — Create and activate a virtual environment
```bash
# Windows
python -m venv .venv
.venv\Scripts\activate

# macOS / Linux
python -m venv .venv
source .venv/bin/activate
```

### 3 — Install dependencies
```bash
pip install -r requirements.txt
```

### 4 — Run the app
```bash
streamlit run app.py
```

Opens automatically at **http://localhost:8501**

---

## 🔑 Demo Credentials

| UID | Name | Passcode |
|---|---|---|
| `HOSTEL-01` | Achintya Singh | `1234` |
| `HOSTEL-02` | Puran | `2345` |
| `HOSTEL-03` | Rahul Verma | `3456` |
| `HOSTEL-04` | Priya Sharma | `4567` |
| `HOSTEL-05` | Karan Mehta | `5678` |

---

## 🗂️ Project Structure

```
hostel-resource-negotiator/
├── app.py                  # Main Streamlit application
├── data.json               # Persistent local state (auto-created on first run)
├── requirements.txt        # Python dependencies
├── .gitignore              # Git exclusions
├── .streamlit/
│   └── config.toml         # Streamlit theme + server config
└── README.md               # This file
```

---

## 🔒 Privacy Guarantee

- **All data lives in `data.json`** — local file, never leaves your machine.
- **AI runs locally via Ollama** — no API keys, no telemetry, no cloud inference.
- **No external network calls** — zero webhooks, zero messaging APIs.

---

## 🛠️ Weekly Credit Reset (Manual)

Run this one-liner to restore all credits to 4:

```bash
python -c "
import json
with open('data.json','r+') as f:
    d = json.load(f)
    for u in d['users'].values():
        u['credits'] = 4
    f.seek(0); json.dump(d, f, indent=2); f.truncate()
print('✅ Credits reset for all users.')
"
```

---

## 🧱 Tech Stack

| Layer | Technology |
|---|---|
| Frontend + Backend | [Streamlit](https://streamlit.io) 1.35+ |
| Local AI | [Ollama](https://ollama.com) Python SDK (`llama3.2` / `gemma`) |
| Persistent Storage | Local `data.json` (no database required) |
| Language | Python 3.10+ |

---

*Built for Wing 4B — may your bookings always be conflict-free and your speakers always returned on time.* 🏠
