<script setup>
import { cn } from '@/lib/utils'

defineProps({
	title: {
		type: String,
		default: ''
	},
	containerClass: {
		type: String,
		default: ''
	},
	titleClass: {
		type: String,
		default: ''
	}
})
</script>

<template>
	<div :class="cn('mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-4 py-8', containerClass)">
		<div v-if="$slots['title-extra']" class="flex flex-wrap items-center justify-between gap-3">
			<h1 :class="cn('text-xl font-bold tracking-tight', titleClass)">{{ title }}</h1>
			<slot name="title-extra" />
		</div>
		<h1 v-else :class="cn('text-xl font-bold tracking-tight', titleClass)">{{ title }}</h1>
		<slot />
	</div>
</template>
