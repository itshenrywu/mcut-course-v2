<script setup>
import { DialogClose, DialogContent, DialogPortal, useForwardPropsEmits } from 'reka-ui'
import { reactiveOmit } from '@vueuse/core'
import { X } from '@lucide/vue'
import { cn } from '@/lib/utils'
import DialogOverlay from '@/components/ui/dialog/DialogOverlay.vue'

const props = defineProps({
	forceMount: { type: Boolean, required: false },
	trapFocus: { type: Boolean, required: false },
	disableOutsidePointerEvents: { type: Boolean, required: false },
	showCloseButton: { type: Boolean, default: true },
	class: { type: null, default: '' }
})
const emits = defineEmits(['escapeKeyDown', 'pointerDownOutside', 'focusOutside', 'interactOutside', 'openAutoFocus', 'closeAutoFocus'])

const delegated_props = reactiveOmit(props, 'class', 'showCloseButton')
const forwarded = useForwardPropsEmits(delegated_props, emits)

function onOpenCloseAutoFocus(event) {
	event.preventDefault()
	event.target?.focus?.()
}
</script>

<template>
	<DialogPortal>
		<DialogOverlay />
		<DialogContent
			data-slot="drawer-content"
			v-bind="forwarded"
			@open-auto-focus="onOpenCloseAutoFocus"
			@close-auto-focus="onOpenCloseAutoFocus"
			:class="cn('bg-color-1 text-color-10 outline-hidden data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom fixed inset-x-0 bottom-0 z-50 mx-auto flex max-w-lg flex-col gap-4 rounded-t-2xl border-t p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] shadow-lg duration-200', props.class)"
		>
			<slot />
			<DialogClose
				v-if="props.showCloseButton"
				class="ring-offset-color-1 focus:ring-color-5 data-[state=open]:bg-color-2 text-color-6 absolute top-4 right-4 rounded-xs opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-none disabled:pointer-events-none"
			>
				<X class="size-4" />
				<span class="sr-only">關閉</span>
			</DialogClose>
		</DialogContent>
	</DialogPortal>
</template>
