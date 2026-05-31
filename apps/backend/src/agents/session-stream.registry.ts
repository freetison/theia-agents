import { Injectable } from '@nestjs/common';
import { ReplaySubject, Observable } from 'rxjs';
import type { AgentProgress } from '../types';

/**
 * In-memory registry of per-session SSE streams.
 * Uses ReplaySubject so late SSE subscribers receive all buffered events.
 */
@Injectable()
export class SessionStreamRegistry {
  private readonly streams = new Map<string, ReplaySubject<AgentProgress>>();

  getOrCreate(sessionId: string): ReplaySubject<AgentProgress> {
    const existing = this.streams.get(sessionId);
    if (existing) return existing;
    const subject = new ReplaySubject<AgentProgress>();
    this.streams.set(sessionId, subject);
    return subject;
  }

  emit(sessionId: string, event: AgentProgress): void {
    this.getOrCreate(sessionId).next(event);
  }

  complete(sessionId: string): void {
    const subject = this.streams.get(sessionId);
    if (subject) {
      subject.complete();
      this.streams.delete(sessionId);
    }
  }

  has(sessionId: string): boolean {
    return this.streams.has(sessionId);
  }

  watch(sessionId: string): Observable<AgentProgress> {
    return this.getOrCreate(sessionId).asObservable();
  }
}
