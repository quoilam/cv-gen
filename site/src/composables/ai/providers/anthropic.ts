import type { LLMProvider, LLMMessage, LLMStreamChunk } from "./types";

export class AnthropicProvider implements LLMProvider {
  readonly id = "anthropic";
  readonly label = "Anthropic";
  private _apiKey: string;

  constructor(apiKey: string) {
    this._apiKey = apiKey;
  }

  async chat(messages: LLMMessage[]): Promise<string> {
    const systemMsg = messages.find((m) => m.role === "system");
    const userMsgs = messages.filter((m) => m.role === "user");

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": this._apiKey,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 4096,
        system: systemMsg?.content,
        messages: userMsgs.map((m) => ({ role: "user", content: m.content }))
      })
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: { message: res.statusText } }));
      throw new Error(err.error?.message ?? `HTTP ${res.status}`);
    }

    const json = await res.json();
    return json.content[0].text;
  }

  async chatStream(
    messages: LLMMessage[],
    onChunk: (chunk: LLMStreamChunk) => void
  ): Promise<void> {
    const systemMsg = messages.find((m) => m.role === "system");
    const userMsgs = messages.filter((m) => m.role === "user");

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": this._apiKey,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 4096,
        system: systemMsg?.content,
        messages: userMsgs.map((m) => ({ role: "user", content: m.content })),
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

        try {
          const json = JSON.parse(data);
          if (json.type === "content_block_delta") {
            onChunk({ content: json.delta.text });
          }
        } catch {
          // skip incomplete JSON
        }
      }
    }
  }
}
