import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { defineComponent, ref } from 'vue';
import { mount } from '@vue/test-utils';

class MockEventSource {
  static instances: MockEventSource[] = [];
  onmessage: ((ev: MessageEvent) => void) | null = null;
  onerror: ((ev: Event) => void) | null = null;
  private _closed = false;

  constructor(public readonly url: string) {
    MockEventSource.instances.push(this);
  }

  close(): void { this._closed = true; }
  get closed(): boolean { return this._closed; }

  emit(type: string, data: unknown): void {
    const evt = new MessageEvent(type, { data: JSON.stringify(data) });
    if (this.onmessage) this.onmessage(evt);
  }
}

describe('useSessionStream', () => {
  beforeEach(() => {
    MockEventSource.instances = [];
    (globalThis as any)['EventSource'] = MockEventSource;
  });

  afterEach(() => {
    delete (globalThis as any)['EventSource'];
  });

  it('opens an EventSource and updates progress on agent:done events', async () => {
    const { useSessionStream } = await import('./useSessionStream');

    const received = ref<string[]>([]);

    const Wrapper = defineComponent({
      setup() {
        const { progress } = useSessionStream('test-session-id');
        return { progress };
      },
      template: '<div>{{ progress.length }}</div>',
    });

    const wrapper = mount(Wrapper);

    expect(MockEventSource.instances).toHaveLength(1);

    const source = MockEventSource.instances[0];
    source.emit('message', {
      sessionId: 'test-session-id',
      agentName: 'biz_evaluator',
      status: 'completed',
      confidence: 0.9,
    });

    await wrapper.vm.$nextTick();
    expect(wrapper.text()).toBe('1');

    wrapper.unmount();
    expect(source.closed).toBe(true);
  });

  it('marks isComplete on session:completed event', async () => {
    const { useSessionStream } = await import('./useSessionStream');

    const Wrapper = defineComponent({
      setup() {
        const { isComplete } = useSessionStream('sid-2');
        return { isComplete };
      },
      template: '<span>{{ isComplete }}</span>',
    });

    const wrapper = mount(Wrapper);
    const source = MockEventSource.instances[0];

    source.emit('message', { agentName: 'session', status: 'completed', sessionId: 'sid-2' });
    await wrapper.vm.$nextTick();
    expect(wrapper.text()).toBe('true');
    wrapper.unmount();
  });
});
