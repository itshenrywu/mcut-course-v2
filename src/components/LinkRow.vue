<script setup>
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { ExternalLink, ChevronRight } from '@lucide/vue'

const props = defineProps({
	to: {
		type: [String, Object],
		default: ''
	},
	href: {
		type: String,
		default: ''
	},
	icon: {
		type: [Object, Function],
		default: null
	},
	label: {
		type: String,
		default: ''
	},
	dot: {
		type: Boolean,
		default: false
	}
})

const is_internal = computed(() => Boolean(props.to))
const link_tag = computed(() => is_internal.value ? RouterLink : 'a')
const link_attrs = computed(() => is_internal.value
	? { to: props.to }
	: { href: props.href, target: '_blank', rel: 'noopener noreferrer' })
</script>

<template>
	<component :is="link_tag" v-bind="link_attrs" class="flex items-center gap-3 px-4 py-3 text-sm hover:bg-color-2">
		<component :is="icon" v-if="icon" class="size-4 shrink-0 text-color-6" />
		<slot>{{ label }}</slot>
		<span v-if="dot" class="size-2 shrink-0 rounded-full bg-red-500" />
		<component :is="is_internal ? ChevronRight : ExternalLink" class="ml-auto size-4 shrink-0 text-color-5" />
	</component>
</template>
