<script setup>
defineProps({
	html: {
		type: String,
		default: ''
	}
})
</script>

<template>
	<div class="rich-html" v-html="html" />
</template>
