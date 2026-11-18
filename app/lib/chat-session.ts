import type { TurnSpec } from "~/data/chat";
import { FEATURED_ID } from "~/data/findings";

/**
 * Chat history kept in memory for the page session, so leaving the Chat
 * screen and coming back shows the same conversation (as in the prototype).
 */
export type Msg =
  | { id: number; kind: "ctx"; fid: string }
  | { id: number; kind: "user"; text: string; cmd?: { k: string; rest: string } }
  | { id: number; kind: "ai"; spec: TurnSpec; done: boolean; stopped?: boolean; secs?: string };

export type ChatSession = {
  messages: Msg[];
  ctx: string;
  ctxVisible: boolean;
  played: boolean;
  personalize: boolean;
  web: boolean;
};

export const session: ChatSession = {
  messages: [],
  ctx: FEATURED_ID,
  ctxVisible: true,
  played: false,
  personalize: true,
  web: false,
};

let nextId = 1;
export const newId = () => nextId++;
