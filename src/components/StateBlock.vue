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
	containerClass: {
		type: String,
		default: ''
	}
})
</script>

<template>
	<div :class="cn('flex flex-col items-center justify-center gap-2 text-center', containerClass)">
		<component :is="icon" v-if="icon" class="mb-1 size-10 text-color-5" />
		<h2 class="text-lg font-medium">{{ title }}</h2>
		<p v-if="description || $slots.default" class="text-color-6 text-sm"><slot>{{ description }}</slot></p>
		<slot name="extra" />
	</div>
</template>
