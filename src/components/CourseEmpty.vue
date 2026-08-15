<script setup>
import { CircleAlert } from '@lucide/vue'
import StateBlock from '@/components/StateBlock.vue'
import { cn } from '@/lib/utils'

defineProps({
	title: {
		type: String,
		default: '找不到符合條件的課程'
	},
	description: {
		type: String,
		default: '請嘗試修改搜尋條件，或選擇其他學期'
	},
	icon: {
		type: [Object, Function],
		default: () => CircleAlert
	},
	containerClass: {
		type: String,
		default: ''
	}
})
</script>

<template>
	<StateBlock :icon="icon" :title="title" :description="description" :container-class="cn('h-full', containerClass)">
		<template v-if="$slots.default" #default><slot /></template>
		<template v-if="$slots.extra" #extra><slot name="extra" /></template>
	</StateBlock>
</template>
