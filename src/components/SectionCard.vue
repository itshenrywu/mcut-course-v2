<script setup>
import { cn } from '@/lib/utils'

defineProps({
	title: {
		type: String,
		default: ''
	},
	sectionClass: {
		type: String,
		default: ''
	},
	titleClass: {
		type: String,
		default: ''
	},
	cardClass: {
		type: String,
		default: ''
	},
	card: {
		type: Boolean,
		default: true
	}
})
</script>

<template>
	<section :class="cn('flex flex-col gap-2', sectionClass)">
		<h2 v-if="title" :class="cn('text-color-6 text-xs', titleClass)">{{ title }}</h2>
		<div v-if="card" :class="cn('bg-color-1 -mx-4 border border-x-0 md:mx-0 md:rounded-lg md:border-x', cardClass)">
			<slot />
		</div>
		<slot v-else />
	</section>
</template>
