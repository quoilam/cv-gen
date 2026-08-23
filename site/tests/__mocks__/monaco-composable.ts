import { vi } from "vitest";

export const useMonaco = () => ({
  setContent: vi.fn(),
  setup: vi.fn(),
  dispose: vi.fn(),
  activateModel: vi.fn(),
  loading: { value: false }
});

export const useMonacoState = () => ({});
