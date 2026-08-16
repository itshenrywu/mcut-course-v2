<script setup>
import { SelectContent, SelectPortal, SelectViewport, useForwardPropsEmits } from 'reka-ui'
import { reactiveOmit } from '@vueuse/core'
import { cn } from '@/lib/utils'

const VIEWPORT_PADDING = 36
const TOUCH_SCROLL_THRESHOLD = 10

const props = defineProps({
	position: { type: String, default: 'popper' },
	side: { type: String, required: false },
	sideOffset: { type: Number, required: false },
	align: { type: String, required: false },
	alignOffset: { type: Number, required: false },
	collisionPadding: { type: null, default: () => ({ top: VIEWPORT_PADDING, bottom: VIEWPORT_PADDING }) },
	class: { type: null, default: '' }
})
const emits = defineEmits(['closeAutoFocus', 'escapeKeyDown', 'pointerDownOutside'])

const delegated_props = reactiveOmit(props, 'class')
const forwarded = useForwardPropsEmits(delegated_props, emits)

let touch_start_pos = null

function handlePointerDown(event) {
	touch_start_pos = event.pointerType === 'mouse' ? null : { x: event.clientX, y: event.clientY }
}

function handlePointerUp(event) {
	const start = touch_start_pos
	touch_start_pos = null
	if (!start) return
	const is_scrolling = Math.abs(event.clientX - start.x) > TOUCH_SCROLL_THRESHOLD || Math.abs(event.clientY - start.y) > TOUCH_SCROLL_THRESHOLD
	if (!is_scrolling) return
	event.stopPropagation()
}

function handlePointerCancel() {
	touch_start_pos = null
}
</script>

<template>
	<SelectPortal>
		<SelectContent
			data-slot="select-content"
			v-bind="forwarded"
			:class="cn('bg-color-1 text-color-10 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 relative z-50 max-h-(--reka-select-content-available-height) min-w-[8rem] max-w-(--reka-select-content-available-width) origin-(--reka-select-content-transform-origin) overflow-x-hidden overflow-y-auto rounded-md border shadow-md', position === 'popper' && 'data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1', props.class)"
		>
			<SelectViewport
				:class="cn('p-1', position === 'popper' && 'h-[var(--reka-select-trigger-height)] w-full min-w-[var(--reka-select-trigger-width)] scroll-my-1')"
			>
				<div
					@pointerdown.capture="handlePointerDown"
					@pointerup.capture="handlePointerUp"
					@pointercancel.capture="handlePointerCancel"
				>
					<slot />
				</div>
			</SelectViewport>
		</SelectContent>
	</SelectPortal>
</template>
