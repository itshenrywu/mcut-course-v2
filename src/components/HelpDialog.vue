<script setup>
import { CircleQuestionMark } from '@lucide/vue'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import HintList from '@/components/HintList.vue'

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
			<HintList class="max-h-[60dvh] overflow-y-auto overscroll-contain">
				<slot />
			</HintList>
		</DialogContent>
	</Dialog>
</template>
