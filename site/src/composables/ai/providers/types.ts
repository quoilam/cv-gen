export interface LLMMessage {
  role: "system" | "user";
  content: string;
}

export interface LLMStreamChunk {
  content: string;
}

export interface LLMProvider {
  readonly id: string;
  readonly label: string;
  chat(messages: LLMMessage[]): Promise<string>;
  chatStream(messages: LLMMessage[], onChunk: (chunk: LLMStreamChunk) => void): Promise<void>;
}
