<script setup>
defineProps({
	label: {
		type: String,
		default: ''
	},
	disabled: {
		type: Boolean,
		default: false
	}
})
</script>

<template>
	<div class="flex flex-col gap-1.5">
		<div v-if="$slots['label-extra']" class="flex items-center gap-1">
			<label class="text-sm font-medium" :class="disabled ? 'text-color-6' : ''">{{ label }}</label>
			<slot name="label-extra" />
		</div>
		<label v-else-if="label" class="text-sm font-medium" :class="disabled ? 'text-color-6' : ''">{{ label }}</label>
		<slot />
	</div>
</template>
