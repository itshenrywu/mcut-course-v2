<script setup>
import FilterField from '@/components/FilterField.vue'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'

defineProps({
	label: {
		type: String,
		default: ''
	},
	options: {
		type: Array,
		default: () => []
	},
	anyLabel: {
		type: String,
		default: ''
	},
	placeholder: {
		type: String,
		default: ''
	},
	disabled: {
		type: Boolean,
		default: false
	},
	inlineDescription: {
		type: Boolean,
		default: false
	}
})

const value = defineModel({ type: String, default: '' })

function toOption(option) {
	return typeof option === 'object' ? option : { value: option, label: option }
}
</script>

<template>
	<FilterField :label="label" :disabled="disabled">
		<Select v-model="value" :disabled="disabled">
			<SelectTrigger class="w-full bg-color-1" :aria-label="label">
				<SelectValue :placeholder="placeholder" />
			</SelectTrigger>
			<SelectContent>
				<SelectItem v-if="anyLabel" value="any">{{ anyLabel }}</SelectItem>
				<SelectItem
					v-for="option in options.map(toOption)"
					:key="option.value"
					:value="option.value"
					:description="option.description"
					:inline-description="inlineDescription"
				>{{ option.label }}</SelectItem>
			</SelectContent>
		</Select>
	</FilterField>
</template>
