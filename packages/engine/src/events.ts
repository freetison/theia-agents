import { EventEmitter } from "events";
import type { TheiaState } from "./state.js";

export interface AgentStartEvent {
  sessionId?: string;
  agent: string;
  sequence: number;
  ts: string;
}

export interface AgentDoneEvent {
  sessionId?: string;
  agent: string;
  role: string;
  timestamp: string;
  summary: string;
  confidence?: number;
  data: Partial<TheiaState>;
}

export interface AgentErrorEvent {
  sessionId?: string;
  agent: string;
  error: string;
}

export const theiaEvents = new EventEmitter();
