import { defineComponent, computed } from 'vue';
import type { PropType } from 'vue';

type AgentCardStatus = 'idle' | 'running' | 'completed' | 'error';

export default defineComponent({
  name: 'AgentCard',

  props: {
    agentName: {
      type: String,
      required: true,
    },
    status: {
      type: String as PropType<AgentCardStatus>,
      required: true,
    },
    confidence: {
      type: Number as PropType<number>,
      default: undefined,
    },
    summary: {
      type: String,
      default: undefined,
    },
    errorMessage: {
      type: String,
      default: undefined,
    },
  },

  emits: ['retry'],

  setup(props, { emit }) {
    const statusClass = computed(() => `agent-card--${props.status}`);

    const displayName = computed(() =>
      props.agentName.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
    );

    function getSummaryText(text: string | undefined): string {
      if (!text) return '';
      const words = text.trim().split(/\s+/);
      return words.length <= 10 ? text : `${words.slice(0, 10).join(' ')}…`;
    }

    const shortSummary = computed(() => getSummaryText(props.summary));

    function handleRetry(): void {
      emit('retry', props.agentName);
    }

    const statusIcon = computed(() => {
      const icons: Record<AgentCardStatus, string> = {
        idle: '○',
        running: '⟳',
        completed: '✓',
        error: '✕',
      };
      return icons[props.status];
    });

    return { statusClass, statusIcon, displayName, shortSummary, handleRetry, getSummaryText };
  },
});
