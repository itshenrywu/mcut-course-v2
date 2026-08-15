<script setup>
import { computed } from 'vue'
import { ChevronDown } from '@lucide/vue'
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover'
import { Checkbox } from '@/components/ui/checkbox'
import FilterField from '@/components/FilterField.vue'

const props = defineProps({
	label: {
		type: String,
		default: ''
	},
	options: {
		type: Array,
		default: () => []
	}
})

const model = defineModel({ type: Object, default: () => ({}) })

function isDisabled(option) {
	return Boolean(option.parent) && !model.value[option.parent]
}

const checked_options = computed(() => props.options.filter(option => model.value[option.key] && !isDisabled(option)))

function summaryLabel(option, checked) {
	if (!option.group) return option.label
	const members = props.options.filter(item => item.group === option.group)
	return members.every(item => checked.includes(item)) ? option.group : option.label
}

const summary = computed(() => {
	const checked = checked_options.value
	if (!checked.length) return '全部隱藏'
	if (checked.length === props.options.length) return '全部顯示'
	const labels = []
	for (const option of checked) {
		const label = summaryLabel(option, checked)
		if (!labels.includes(label)) labels.push(label)
	}
	return labels.join('、')
})

function toggle(option, value) {
	model.value = { ...model.value, [option.key]: value }
}
</script>

<template>
	<FilterField :label="label">
		<Popover>
			<PopoverTrigger
				class="border-color-3 bg-color-1 focus-visible:border-color-5 focus-visible:ring-color-5/50 flex h-9 w-full items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-[3px]"
				:aria-label="label"
			>
				<span class="truncate">{{ summary }}</span>
				<ChevronDown class="size-4 shrink-0 opacity-50" />
			</PopoverTrigger>
			<PopoverContent align="start" class="w-(--reka-popover-trigger-width) min-w-56 p-1">
				<Checkbox
					v-for="option in options"
					:key="option.key"
					:model-value="model[option.key]"
					:disabled="isDisabled(option)"
					class="hover:bg-color-2 rounded-sm py-1.5 pr-2"
					:class="option.parent ? 'pl-7' : 'pl-2'"
					@update:model-value="toggle(option, $event)"
				>{{ option.label }}</Checkbox>
			</PopoverContent>
		</Popover>
	</FilterField>
</template>
