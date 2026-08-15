<script setup>
import { DialogClose } from 'reka-ui'

const props = defineProps({
	class: { type: null, default: '' }
})
</script>

<template>
	<DialogClose data-slot="dialog-close" :class="props.class">
		<slot />
	</DialogClose>
</template>
