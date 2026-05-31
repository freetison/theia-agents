import { defineComponent, computed } from 'vue';
import type { PropType } from 'vue';

type Verdict = 'GO' | 'NO-GO' | 'CONDITIONAL';

export default defineComponent({
  name: 'VerdictBadge',

  props: {
    verdict: {
      type: String as PropType<Verdict>,
      required: true,
    },
    viabilityScore: {
      type: Number as PropType<number>,
      default: undefined,
    },
  },

  setup(props) {
    const colorMap: Record<Verdict, string> = {
      'GO': 'verdict--go',
      'NO-GO': 'verdict--no-go',
      'CONDITIONAL': 'verdict--conditional',
    };

    const badgeClass = computed(() => colorMap[props.verdict] ?? 'verdict--conditional');

    return { badgeClass };
  },
});
