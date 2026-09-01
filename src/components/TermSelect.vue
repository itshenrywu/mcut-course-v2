<script setup>
import { computed } from 'vue'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectGroup, SelectLabel, SelectItem } from '@/components/ui/select'
import { TERM_NOTES, formatTermName, formatTermLabel } from '@/lib/term'

const props = defineProps({
	termList: {
		type: Array,
		default: () => []
	},
	placeholder: {
		type: String,
		default: '選擇學期'
	},
	triggerClass: {
		type: String,
		default: ''
	},
	contentClass: {
		type: String,
		default: ''
	},
	disabled: {
		type: Boolean,
		default: false
	},
	descriptionMap: {
		type: Object,
		default: null
	}
})

const term_id = defineModel({ type: String, default: '' })

const term_groups = computed(() => {
	const map = new Map()
	for (const id of props.termList) {
		const [year, term] = id.split('-')
		if (!map.has(year)) map.set(year, [])
		map.get(year).push({
			term_id: id,
			label: formatTermName(term),
			description: props.descriptionMap ? props.descriptionMap[id] : TERM_NOTES[term]
		})
	}
	for (const terms of map.values()) {
		terms.sort((a, b) => Number(a.term_id.split('-')[1]) - Number(b.term_id.split('-')[1]))
	}
	return Array.from(map, ([year, terms]) => ({ year: Number(year), terms }))
})

const selected_term_label = computed(() => formatTermLabel(term_id.value))
</script>

<template>
	<Select v-model="term_id" :disabled="disabled">
		<SelectTrigger :class="triggerClass" aria-label="學期選擇">
			<SelectValue :placeholder="placeholder">{{ selected_term_label }}</SelectValue>
		</SelectTrigger>
		<SelectContent :class="contentClass" :side-offset="12">
			<SelectGroup v-for="group in term_groups" :key="group.year">
				<SelectLabel>{{ group.year }} 學年</SelectLabel>
				<SelectItem
					v-for="term in group.terms"
					:key="term.term_id"
					:value="term.term_id"
					:description="term.description"
					inline-description
				>
					{{ term.label }}
				</SelectItem>
			</SelectGroup>
		</SelectContent>
	</Select>
</template>
