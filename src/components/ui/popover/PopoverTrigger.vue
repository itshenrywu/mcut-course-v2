<script setup>
import { PopoverTrigger } from 'reka-ui'

const props = defineProps({
	asChild: { type: Boolean, default: undefined },
	as: { type: null, default: undefined },
	class: { type: null, default: '' }
})
</script>

<template>
	<PopoverTrigger data-slot="popover-trigger" v-bind="props">
		<slot />
	</PopoverTrigger>
</template>
