import type { Update } from "grammy/types";

let updateId = 1;

/** Testlar uchun Telegram xabar update'i (buyruq bo'lsa bot_command entity bilan). */
export function messageUpdate(text: string, chatType: "private" | "group" = "private"): Update {
  const chat = chatType === "private" ? { id: 7, type: "private" as const, first_name: "Ali" } : { id: -100, type: "group" as const, title: "G" };
  const isCommand = text.startsWith("/");
  return {
    update_id: updateId++,
    message: {
      message_id: updateId, date: 0, chat, from: { id: 7, is_bot: false, first_name: "Ali" }, text,
      ...(isCommand ? { entities: [{ type: "bot_command", offset: 0, length: text.split(" ")[0].length }] } : {}),
    },
  } as Update;
}
