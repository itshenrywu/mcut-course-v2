<script setup>
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog'

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
	confirmText: {
		type: String,
		default: '確認'
	},
	cancelText: {
		type: String,
		default: '取消'
	},
	confirmVariant: {
		type: String,
		default: 'default'
	},
	altText: {
		type: String,
		default: ''
	},
	altVariant: {
		type: String,
		default: 'destructive-ghost'
	}
})

const emit = defineEmits(['confirm', 'alt'])

function onConfirm() {
	open.value = false
	emit('confirm')
}

function onAlt() {
	open.value = false
	emit('alt')
}
</script>

<template>
	<Dialog v-model:open="open">
		<DialogContent class="max-w-sm" :show-close-button="!!props.altText">
			<DialogHeader>
				<DialogTitle>{{ props.title }}</DialogTitle>
				<DialogDescription v-if="props.description">{{ props.description }}</DialogDescription>
			</DialogHeader>
			<DialogFooter>
				<Button v-if="props.altText" :variant="props.altVariant" class="flex-1" @click="onAlt()">{{ props.altText }}</Button>
				<DialogClose v-else as-child>
					<Button variant="secondary" class="flex-1">{{ props.cancelText }}</Button>
				</DialogClose>
				<Button :variant="props.confirmVariant" class="flex-1" @click="onConfirm()">{{ props.confirmText }}</Button>
			</DialogFooter>
		</DialogContent>
	</Dialog>
</template>
