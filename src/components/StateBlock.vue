<script setup>
import { cn } from '@/lib/utils'

defineProps({
	icon: {
		type: [Object, Function],
		default: null
	},
	title: {
		type: String,
		default: ''
	},
	description: {
		type: String,
		default: ''
	},
	level: {
		type: Number,
		default: 2
	},
	containerClass: {
		type: String,
		default: ''
	}
})
</script>

<template>
	<div :class="cn('flex flex-col items-center justify-center gap-2 text-center', containerClass)">
		<component :is="icon" v-if="icon" class="mb-1 size-10 text-color-5" />
		<component :is="`h${level}`" class="text-lg font-medium">{{ title }}</component>
		<p v-if="description || $slots.default" class="text-sm text-color-6"><slot>{{ description }}</slot></p>
		<slot name="extra" />
	</div>
</template>
