<script setup>
import { computed } from 'vue'
import { cn } from '@/lib/utils'

const BASE_CLASS = 'text-color-8 marker:text-color-5 list-outside space-y-1 pl-5 text-sm leading-relaxed'

const props = defineProps({
	ordered: {
		type: Boolean,
		default: false
	},
	class: {
		type: null,
		default: ''
	}
})

const list_class = computed(() => cn(
	BASE_CLASS,
	props.ordered ? 'list-decimal marker:tabular-nums' : 'list-disc',
	props.class
))
</script>

<template>
	<component :is="ordered ? 'ol' : 'ul'" :class="list_class">
		<slot />
	</component>
</template>
