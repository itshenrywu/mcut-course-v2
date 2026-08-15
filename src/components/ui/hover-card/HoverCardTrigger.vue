<script setup>
import { HoverCardTrigger } from 'reka-ui'

const props = defineProps({
	asChild: { type: Boolean, default: undefined },
	as: { type: null, default: undefined }
})
</script>

<template>
	<HoverCardTrigger data-slot="hover-card-trigger" v-bind="props">
		<slot />
	</HoverCardTrigger>
</template>
