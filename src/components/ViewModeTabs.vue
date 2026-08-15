<script setup>
import { computed } from 'vue'
import { List, CalendarDays } from '@lucide/vue'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

const DEFAULT_MODES = [
	{ value: 'list', label: '列表', icon: List },
	{ value: 'table', label: '課表', icon: CalendarDays }
]

const props = defineProps({
	modes: {
		type: Array,
		default: () => []
	},
	compact: {
		type: Boolean,
		default: false
	},
	rootClass: {
		type: String,
		default: ''
	}
})

const view_mode = defineModel({ type: String, default: 'list' })

const mode_list = computed(() => props.modes.length ? props.modes : DEFAULT_MODES)
</script>

<template>
	<Tabs v-model="view_mode" :class="rootClass">
		<TabsList class="bg-color-1 border-color-3 border" :class="compact ? 'h-8' : 'w-full'" aria-label="檢視模式">
			<TabsTrigger
				v-for="mode in mode_list"
				:key="mode.value"
				:value="mode.value"
				:aria-label="`${mode.label}檢視`"
				:class="compact && 'text-xs'"
			>
				<component :is="mode.icon" class="size-4" />
				<span :class="compact && 'hidden sm:inline'">{{ mode.label }}</span>
			</TabsTrigger>
		</TabsList>
	</Tabs>
</template>
