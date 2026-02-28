import enUS from "@/i18n/messages/en-US";
import ptBR from "@/i18n/messages/pt-BR";

export const MESSAGES = {
  "en-US": enUS,
  "pt-BR": ptBR,
} as const;

export type Messages = (typeof MESSAGES)["pt-BR"];
