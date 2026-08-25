<script setup>
defineProps({
	headers: {
		type: Array,
		default: () => []
	},
	fixed: {
		type: Boolean,
		default: false
	},
	headerClass: {
		type: String,
		default: ''
	}
})
</script>

<template>
	<table class="w-full text-sm" :class="fixed ? 'table-fixed' : ''">
		<thead>
			<tr class="bg-color-3 text-xs text-color-7">
				<th v-for="(header, index) in headers" :key="index" class="px-3 py-2 text-left font-medium" :class="[headerClass, header.class]">{{ header.label || header }}</th>
			</tr>
		</thead>
		<tbody class="divide-y">
			<slot />
		</tbody>
	</table>
</template>
