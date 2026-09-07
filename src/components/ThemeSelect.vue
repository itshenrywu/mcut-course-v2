<script setup>
import { computed } from 'vue'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import FilterField from '@/components/FilterField.vue'
import { themeColor } from '@/lib/my-course'

const props = defineProps({
	label: {
		type: String,
		default: ''
	},
	themes: {
		type: Array,
		default: () => []
	}
})

const model = defineModel({ type: Number, default: 0 })

// 空清單時退回一個中性主題, 避免後面取值失敗
const current = computed(() => props.themes.find(theme => theme.value === model.value) || props.themes[0] || { colors: ['transparent'], text: 'inherit' })

function barStyle(colors) {
	if (colors.length < 2) return { background: colors[0] }
	const step = 100 / colors.length
	const stops = colors.map((color, index) => `${color} ${index * step}% ${(index + 1) * step}%`)
	return { background: `linear-gradient(to right, ${stops.join(', ')})` }
}

function triggerStyle(theme) {
	return { ...barStyle(theme.colors), '--chevron': themeColor(theme.text, theme.colors.length - 1) }
}

function itemStyle(theme) {
	return { ...barStyle(theme.colors), '--check': themeColor(theme.text, 0) }
}
</script>

<template>
	<FilterField :label="label">
		<Select v-model="model">
			<SelectTrigger
				class="w-full [&_svg]:text-(color:--chevron)! [&_svg]:opacity-100!"
				:aria-label="label"
				:style="triggerStyle(current)"
			>
				<SelectValue><span class="h-5"></span></SelectValue>
			</SelectTrigger>
			<SelectContent floating class="[&_[data-reka-select-viewport]]:p-0">
				<SelectItem
					v-for="theme in themes"
					:key="theme.value"
					:value="theme.value"
					class="h-8 rounded-none px-0 pointer-fine:focus:shadow-[inset_0_0_0_2px_var(--color-color-1),inset_0_0_0_3px_var(--color-color-10)] [&_svg]:text-(color:--check)!"
					:style="itemStyle(theme)"
				></SelectItem>
			</SelectContent>
		</Select>
	</FilterField>
</template>
