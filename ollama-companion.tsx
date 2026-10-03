"use client";

import { useState, type FormEvent } from "react";
import { Bot, Check, CircleAlert, LoaderCircle, Send, Wifi, WifiOff } from "lucide-react";
import { askLocalOllama, checkLocalOllama, type LocalChatMessage } from "@/lib/ollama-client";

const SYSTEM_PROMPT = "You are a witty, street-smart AI companion who lives in the hostel block of Wing 4B. Give concise, practical help with hostel life, resource bookings, study breaks, roommate diplomacy, and late-night snacks. Be warm, lightly humorous, and never claim to have accessed private data.";

type Connection = "unknown" | "online" | "offline";

export function OllamaCompanion({ name, onModelChange }: { name: string; onModelChange: (model: string) => void }) {
  const [model, setModel] = useState("llama3.2");
  const [connection, setConnection] = useState<Connection>("unknown");
  const [models, setModels] = useState<string[]>([]);
  const [messages, setMessages] = useState<LocalChatMessage[]>([]);
  const [origin, setOrigin] = useState("this page");
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);

  async function checkConnection() {
    setOrigin(window.location.origin);
    setConnection("unknown");
    try {
      const result = await checkLocalOllama();
      const names = (result.models ?? []).map((item) => item.name).filter(Boolean);
      setModels(names);
      setConnection("online");
      if (!names.some((item) => item === model || item.startsWith(`${model}:`)) && names.length === 1) {
        setModel(names[0]);
        onModelChange(names[0]);
      }
    } catch {
      setConnection("offline");
    }
  }

  async function sendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const content = input.trim().slice(0, 1000);
    if (!content || pending) return;
    setOrigin(window.location.origin);
    const nextMessages = [...messages, { role: "user" as const, content }];
    setMessages(nextMessages);
    setInput("");
    setPending(true);
    try {
      const reply = await askLocalOllama(model, nextMessages.slice(-12), SYSTEM_PROMPT);
      setMessages([...nextMessages, { role: "assistant", content: reply }]);
      setConnection("online");
    } catch {
      setMessages([...nextMessages, {
        role: "assistant",
        content: "I can’t reach Ollama on this device right now. Start Ollama locally, allow this site in OLLAMA_ORIGINS, then try again. Your message was not sent anywhere else.",
      }]);
      setConnection("offline");
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="surface companion-surface" aria-labelledby="companion-title">
      <div className="surface-heading companion-heading">
        <div><span className="section-kicker">ON YOUR DEVICE ONLY</span><h2 id="companion-title">The hostel companion</h2>
          <p>A little local intelligence for hostel life. No cloud fallback, ever.</p>
        </div>
        <div className={`ollama-state ${connection}`} aria-live="polite">
          {connection === "online" ? <Wifi aria-hidden="true" /> : connection === "offline" ? <WifiOff aria-hidden="true" /> : <Bot aria-hidden="true" />}
          {connection === "online" ? "Ollama connected" : connection === "offline" ? "Ollama offline" : "Local model"}
        </div>
      </div>

      <div className="ollama-setup">
        <div className="ollama-setup-copy"><span className="ollama-icon"><Bot aria-hidden="true" /></span><div><strong>Meet your Wing 4B regular</strong><p>Hey {name.split(" ")[0]}, your conversation goes from this browser straight to Ollama on your device.</p></div></div>
        <div className="ollama-controls">
          <label className="field-label model-field"><span>Local model</span>
            <input list="ollama-models" value={model} onChange={(event) => { setModel(event.target.value); onModelChange(event.target.value); }} aria-label="Ollama model name" placeholder="llama3.2" />
            <datalist id="ollama-models">{models.map((item) => <option key={item} value={item} />)}</datalist>
          </label>
          <button className="button button-quiet" type="button" onClick={checkConnection}>
            {connection === "online" ? <Check aria-hidden="true" /> : connection === "offline" ? <CircleAlert aria-hidden="true" /> : <Wifi aria-hidden="true" />}
            Check Ollama
          </button>
        </div>
        {connection === "offline" && (
          <div className="ollama-help" role="status"><strong>Keep it local</strong><span>Install Ollama, run <code>ollama pull {model || "llama3.2"}</code>, then add <code>{origin}</code> to <code>OLLAMA_ORIGINS</code> and restart Ollama. Replies are never routed to a hosted AI.</span></div>
        )}
      </div>

      <div className="conversation" aria-live="polite" aria-label="Hostel companion conversation">
        {messages.length === 0 ? (
          <div className="conversation-empty"><span className="conversation-mark"><Bot aria-hidden="true" /></span><strong>Ask the unofficial hostel expert.</strong><span>Roommate diplomacy, study breaks, or whether the speaker belongs at 2 a.m.</span></div>
        ) : messages.map((message, index) => (
          <article className={`chat-row ${message.role}`} key={`${index}-${message.role}`}>
            <span className="chat-avatar">{message.role === "assistant" ? <Bot aria-hidden="true" /> : name.slice(0, 1).toUpperCase()}</span>
            <p>{message.content}</p>
          </article>
        ))}
        {pending && <div className="chat-thinking"><LoaderCircle className="spin" aria-hidden="true" /> Your local model is thinking…</div>}
      </div>

      <form className="chat-composer" onSubmit={sendMessage}>
        <label className="sr-only" htmlFor="companion-message">Message the local hostel companion</label>
        <textarea id="companion-message" value={input} onChange={(event) => setInput(event.target.value)} placeholder="Ask something about hostel life…" rows={2} maxLength={1000} disabled={pending} />
        <button className="button button-primary send-button" type="submit" disabled={pending || !input.trim()} aria-label="Send message">
          {pending ? <LoaderCircle className="spin" aria-hidden="true" /> : <Send aria-hidden="true" />}
        </button>
      </form>
      <p className="privacy-caption">Local endpoint: localhost:11434 · {messages.length} messages in this tab · chat is not saved.</p>
    </section>
  );
}
