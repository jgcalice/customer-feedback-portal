import type { Messages } from "@/i18n/messages";

function resolvePath(messages: Messages, key: string): string | undefined {
  const parts = key.split(".");
  let cursor: unknown = messages;
  for (const part of parts) {
    if (typeof cursor !== "object" || cursor === null || !(part in cursor)) {
      return undefined;
    }
    cursor = (cursor as Record<string, unknown>)[part];
  }
  return typeof cursor === "string" ? cursor : undefined;
}

export function translate(
  messages: Messages,
  key: string,
  vars?: Record<string, string | number>
) {
  const base = resolvePath(messages, key) ?? key;
  if (!vars) return base;

  return base.replace(/\{(\w+)\}/g, (_, name: string) => {
    const value = vars[name];
    return value === undefined ? `{${name}}` : String(value);
  });
}
