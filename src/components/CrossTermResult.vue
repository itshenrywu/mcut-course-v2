<script setup>
import { computed } from 'vue'
import { formatTermLabel } from '@/lib/term'
import InlineLoading from '@/components/InlineLoading.vue'
import { Button } from '@/components/ui/button'

const MAX_TERM_BUTTONS = 4

const props = defineProps({
	result: {
		type: Object,
		required: true
	},
	loading: Boolean
})

defineEmits(['select-term'])

const term_buttons = computed(() => props.result.term_counts.slice(0, MAX_TERM_BUTTONS))
</script>

<template>
	<InlineLoading v-if="loading" text="搜尋其他學期…" />
	<template v-else-if="result.total">
		<Button
			v-for="term in term_buttons"
			:key="term.term_id"
			variant="outline"
			size="sm"
			class="bg-color-1"
			@click="$emit('select-term', term.term_id)"
		>
			切換到 {{ formatTermLabel(term.term_id) }}
			<span class="text-color-6">{{ term.count }} 門</span>
		</Button>
	</template>
</template>
