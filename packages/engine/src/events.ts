import { EventEmitter } from "events";
import type { TheiaState } from "./state.js";

export interface AgentDoneEvent {
  agent: string;
  role: string;
  timestamp: string;
  summary: string;
  data: Partial<TheiaState>;
}

export const theiaEvents = new EventEmitter();
