<script setup>
import { computed } from 'vue'
import { SelectContent, SelectPortal, SelectViewport, injectSelectRootContext, useForwardPropsEmits } from 'reka-ui'
import { reactiveOmit } from '@vueuse/core'
import { cn } from '@/lib/utils'
import { trackOverlay } from '@/lib/overlay'
import { DROPDOWN_OVERLAY_CLASS, DROPDOWN_PANEL_CLASS, useDropdownScrollToSelected, useDropdownTouchGuard, useFullscreenDropdown } from '@/lib/dropdown'

const VIEWPORT_PADDING = 36

const BASE_CLASS = 'bg-color-1 text-color-10 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 z-50 rounded-md border shadow-md'
const POPPER_CLASS = 'relative max-h-(--reka-select-content-available-height) min-w-[8rem] max-w-(--reka-select-content-available-width) origin-(--reka-select-content-transform-origin) overflow-x-hidden overflow-y-auto'
const POPPER_OFFSET_CLASS = 'data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1'

const props = defineProps({
	position: { type: String, default: 'popper' },
	side: { type: String, required: false },
	sideOffset: { type: Number, required: false },
	align: { type: String, required: false },
	alignOffset: { type: Number, required: false },
	collisionPadding: { type: null, default: () => ({ top: VIEWPORT_PADDING, bottom: VIEWPORT_PADDING }) },
	floating: { type: Boolean, default: false },
	class: { type: null, default: '' }
})
const emits = defineEmits(['closeAutoFocus', 'escapeKeyDown', 'pointerDownOutside'])

const delegated_props = reactiveOmit(props, 'class', 'floating', 'position')
const forwarded = useForwardPropsEmits(delegated_props, emits)

const is_fullscreen = useFullscreenDropdown(props)

const root_context = injectSelectRootContext()

const overlay_open = computed(() => is_fullscreen.value && root_context.open.value)

trackOverlay(overlay_open)
useDropdownScrollToSelected(overlay_open, '[data-reka-select-viewport]')

const touch_guard = useDropdownTouchGuard()
</script>

<template>
	<SelectPortal>
		<div v-if="overlay_open" data-slot="dropdown-overlay" :class="DROPDOWN_OVERLAY_CLASS" @touchmove.prevent></div>
		<SelectContent
			data-slot="select-content"
			:data-fullscreen="is_fullscreen ? '' : undefined"
			v-bind="forwarded"
			:position="is_fullscreen ? 'popper' : position"
			:class="cn(BASE_CLASS, is_fullscreen ? DROPDOWN_PANEL_CLASS : [POPPER_CLASS, position === 'popper' && POPPER_OFFSET_CLASS], props.class)"
		>
			<SelectViewport
				:class="cn('p-1', is_fullscreen ? 'relative min-h-0 overscroll-contain' : position === 'popper' && 'h-[var(--reka-select-trigger-height)] w-full min-w-[var(--reka-select-trigger-width)] scroll-my-1')"
			>
				<div
					@pointerdown.capture="touch_guard.onPointerDown"
					@pointerup.capture="touch_guard.onPointerUp"
					@pointercancel.capture="touch_guard.onPointerCancel"
					@click.capture="touch_guard.onClick"
				>
					<slot />
				</div>
			</SelectViewport>
		</SelectContent>
	</SelectPortal>
</template>
