import { defineComponent, computed } from 'vue';
import type { PropType } from 'vue';

type ConfidenceLevel = 'low' | 'medium' | 'high';

export default defineComponent({
  name: 'ConfidenceBadge',

  props: {
    confidence: {
      type: Number as PropType<number>,
      required: true,
    },
  },

  setup(props) {
    function getLevel(value: number): ConfidenceLevel {
      if (value < 0.5) return 'low';
      if (value < 0.7) return 'medium';
      return 'high';
    }

    const level = computed(() => getLevel(props.confidence));

    const colorMap: Record<ConfidenceLevel, string> = {
      low: 'badge--low',
      medium: 'badge--medium',
      high: 'badge--high',
    };

    const badgeClass = computed(() => colorMap[level.value]);
    const pct = computed(() => Math.round(props.confidence * 100));

    return { level, badgeClass, pct };
  },
});
