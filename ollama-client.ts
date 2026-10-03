const OLLAMA_ROOT = "http://localhost:11434";

export type LocalChatMessage = { role: "user" | "assistant"; content: string };

type OllamaTags = { models?: { name: string }[] };

async function ollamaFetch(path: string, init?: RequestInit, timeoutMs = 5_000) {
  const headers = new Headers(init?.headers);
  if (init?.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  return fetch(`${OLLAMA_ROOT}${path}`, {
    ...init,
    mode: "cors",
    credentials: "omit",
    signal: AbortSignal.timeout(timeoutMs),
    headers,
  });
}

export async function checkLocalOllama() {
  const response = await ollamaFetch("/api/tags", { method: "GET" });
  if (!response.ok) throw new Error("Ollama did not respond.");
  return (await response.json()) as OllamaTags;
}

export async function askLocalOllama(
  model: string,
  messages: LocalChatMessage[],
  system: string,
  timeoutMs = 90_000,
) {
  const response = await ollamaFetch("/api/chat", {
    method: "POST",
    body: JSON.stringify({
      model: model.trim() || "llama3.2",
      stream: false,
      messages: [{ role: "system", content: system }, ...messages],
    }),
  }, timeoutMs);
  if (!response.ok) throw new Error("The selected local model could not reply.");
  const result = (await response.json()) as { message?: { content?: string } };
  const content = result.message?.content?.trim();
  if (!content) throw new Error("The local model returned an empty reply.");
  return content.slice(0, 3000);
}

export async function localWardenNote(model: string, userName: string, resource: string, slot: string) {
  return askLocalOllama(
    model,
    [{
      role: "user",
      content: `${userName} reserved ${resource} for ${slot}. Write a short, dryly funny hostel-warden confirmation with one usage tip and a reminder to return on time. No emojis.`,
    }],
    "You are a fair, strict, dry-humoured hostel warden at an Indian engineering college. Reply in no more than 45 words.",
    8_000,
  );
}
