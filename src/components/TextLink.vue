<script setup>
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { cn } from '@/lib/utils'

const props = defineProps({
	to: {
		type: [String, Object],
		default: ''
	},
	href: {
		type: String,
		default: ''
	},
	nofollow: {
		type: Boolean,
		default: false
	},
	class: {
		type: null,
		default: ''
	}
})

const is_internal = computed(() => Boolean(props.to))
// tel: / mailto: 交給系統開, 不能加 target="_blank"
const is_external = computed(() => /^https?:/.test(props.href))
const link_tag = computed(() => is_internal.value ? RouterLink : 'a')
const link_attrs = computed(() => {
	if (is_internal.value) return { to: props.to }
	if (!is_external.value) return { href: props.href }
	return {
		href: props.href,
		target: '_blank',
		rel: props.nofollow ? 'nofollow noopener noreferrer' : 'noopener noreferrer'
	}
})
</script>

<template>
	<component :is="link_tag" v-bind="link_attrs" :class="cn('text-color-10 underline underline-offset-2', props.class)">
		<slot />
	</component>
</template>
