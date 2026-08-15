<script setup>
import { cn } from '@/lib/utils'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'

defineProps({
	title: {
		type: String,
		default: ''
	},
	count: {
		type: Number,
		default: 0
	},
	listClass: {
		type: String,
		default: ''
	}
})

const open = defineModel('open', { type: Boolean, default: false })
</script>

<template>
	<Dialog v-model:open="open">
		<slot name="trigger" />
		<DialogContent>
			<DialogHeader>
				<DialogTitle class="flex items-center gap-2">
					<span>{{ title }} <span class="text-color-6 text-sm font-normal">({{ count }})</span></span>
					<slot name="title-extra" />
				</DialogTitle>
				<DialogDescription v-if="$slots.description">
					<span class="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs">
						<slot name="description" />
					</span>
				</DialogDescription>
			</DialogHeader>
			<div :class="cn('-mx-2 flex max-h-[60dvh] flex-col gap-1 overflow-y-auto overscroll-contain', listClass)">
				<slot />
			</div>
		</DialogContent>
	</Dialog>
</template>
