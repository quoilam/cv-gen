import { isObject } from "./is";

export const htmlEscape = (str: string) => {
  const escapeMap: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "'": "&#39;",
    '"': "&quot;"
  };

  return str.replace(/[&<>'"]/g, (char) => escapeMap[char]);
};

export const copy = <T>(obj: T): T => {
  if (isObject(obj)) return JSON.parse(JSON.stringify(obj));
  throw new Error("Input must be a non-null object.");
};

export const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const now = () => Date.now();

export const arrayify = <T>(value: T | T[]): T[] =>
  Array.isArray(value) ? value : [value];
