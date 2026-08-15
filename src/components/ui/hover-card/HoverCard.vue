<script setup>
import { HoverCardRoot, useForwardPropsEmits } from 'reka-ui'

const props = defineProps({
	defaultOpen: { type: Boolean, default: undefined },
	open: { type: Boolean, default: undefined },
	openDelay: { type: Number, default: undefined },
	closeDelay: { type: Number, default: undefined }
})
const emits = defineEmits(['update:open'])

const forwarded = useForwardPropsEmits(props, emits)
</script>

<template>
	<HoverCardRoot data-slot="hover-card" v-bind="forwarded">
		<slot />
	</HoverCardRoot>
</template>
