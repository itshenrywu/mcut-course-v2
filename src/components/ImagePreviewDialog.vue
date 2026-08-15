<script setup>
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'

const open = defineModel('open', { type: Boolean, default: false })

const props = defineProps({
	title: {
		type: String,
		default: ''
	},
	description: {
		type: String,
		default: ''
	},
	src: {
		type: String,
		default: ''
	},
	alt: {
		type: String,
		default: ''
	}
})
</script>

<template>
	<Dialog v-model:open="open">
		<DialogContent class="max-w-sm">
			<DialogHeader class="pr-6">
				<DialogTitle>{{ props.title }}</DialogTitle>
				<DialogDescription v-if="props.description">{{ props.description }}</DialogDescription>
			</DialogHeader>
			<img v-if="props.src" :src="props.src" :alt="props.alt" class="max-h-[65dvh] w-full rounded-md object-contain" />
		</DialogContent>
	</Dialog>
</template>
