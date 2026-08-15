<script setup>
import { CircleQuestionMark } from '@lucide/vue'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'

defineProps({
	title: {
		type: String,
		default: '使用說明'
	},
	buttonClass: {
		type: String,
		default: ''
	}
})
</script>

<template>
	<Dialog>
		<DialogTrigger as-child>
			<Button variant="ghost" size="sm" :class="['text-color-6 hover:text-color-10', buttonClass]">
				<CircleQuestionMark class="size-4" />
				{{ title }}
			</Button>
		</DialogTrigger>
		<DialogContent>
			<DialogHeader>
				<DialogTitle>{{ title }}</DialogTitle>
			</DialogHeader>
			<ul class="text-color-8 max-h-[60dvh] list-disc space-y-2 overflow-y-auto overscroll-contain pl-5 text-sm leading-relaxed">
				<slot />
			</ul>
		</DialogContent>
	</Dialog>
</template>
