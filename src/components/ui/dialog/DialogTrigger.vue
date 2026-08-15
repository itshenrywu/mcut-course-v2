<script setup>
import { DialogTrigger } from 'reka-ui'

const props = defineProps({
	class: { type: null, default: '' }
})
</script>

<template>
	<DialogTrigger data-slot="dialog-trigger" :class="props.class">
		<slot />
	</DialogTrigger>
</template>
