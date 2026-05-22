import type { LLMProvider, LLMMessage, LLMStreamChunk } from "./types";

export class OpenAIProvider implements LLMProvider {
  readonly id = "openai";
  readonly label = "OpenAI";
  private _apiKey: string;
  private _baseUrl: string;

  constructor(apiKey: string, baseUrl = "https://api.openai.com/v1") {
    this._apiKey = apiKey;
    this._baseUrl = baseUrl;
  }

  async chat(messages: LLMMessage[]): Promise<string> {
    const res = await fetch(`${this._baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this._apiKey}`
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages,
        temperature: 0.7
      })
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: { message: res.statusText } }));
      throw new Error(err.error?.message ?? `HTTP ${res.status}`);
    }

    const json = await res.json();
    return json.choices[0].message.content;
  }

  async chatStream(
    messages: LLMMessage[],
    onChunk: (chunk: LLMStreamChunk) => void
  ): Promise<void> {
    const res = await fetch(`${this._baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this._apiKey}`
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages,
        temperature: 0.7,
        stream: true
      })
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: { message: res.statusText } }));
      throw new Error(err.error?.message ?? `HTTP ${res.status}`);
    }

    const reader = res.body!.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith("data: ")) continue;
        const data = trimmed.slice(6);
        if (data === "[DONE]") return;

        try {
          const json = JSON.parse(data);
          const content = json.choices?.[0]?.delta?.content;
          if (content) onChunk({ content });
        } catch {
          // skip incomplete JSON chunks
        }
      }
    }
  }
}
