<script setup>
defineProps({
	parts: {
		type: Array,
		default: () => []
	},
	separatorClass: {
		type: String,
		default: 'text-color-6 mx-1 text-xs'
	},
	fallback: {
		type: String,
		default: ''
	}
})
</script>

<template>
	<template v-if="parts.length">
		<template v-for="(part, index) in parts" :key="index">
			<span v-if="index > 0" :class="separatorClass">/</span>{{ part }}
		</template>
	</template>
	<template v-else>{{ fallback }}</template>
</template>
