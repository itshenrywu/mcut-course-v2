<script setup>
import { ComboboxContent, ComboboxEmpty, ComboboxInput, ComboboxPortal, ComboboxViewport, useForwardPropsEmits } from 'reka-ui'
import { reactiveOmit } from '@vueuse/core'
import { Search } from '@lucide/vue'
import { cn } from '@/lib/utils'
import { useDevice } from '@/composables/useDevice'

const VIEWPORT_PADDING = 36
const TOUCH_SCROLL_THRESHOLD = 10

const props = defineProps({
	position: { type: String, default: 'popper' },
	side: { type: String, required: false },
	sideOffset: { type: Number, default: 4 },
	align: { type: String, default: 'start' },
	alignOffset: { type: Number, required: false },
	collisionPadding: { type: null, default: () => ({ top: VIEWPORT_PADDING, bottom: VIEWPORT_PADDING }) },
	searchPlaceholder: { type: String, default: '搜尋' },
	emptyText: { type: String, default: '找不到符合的項目' },
	class: { type: null, default: '' }
})
const emits = defineEmits(['escapeKeyDown', 'pointerDownOutside'])

const delegated_props = reactiveOmit(props, 'class', 'searchPlaceholder', 'emptyText')
const forwarded = useForwardPropsEmits(delegated_props, emits)

const { is_touch } = useDevice()

let touch_start_pos = null
let input_focusable = false

// reka 開啟時會強制 focus 搜尋框, 觸控裝置上鍵盤會彈出來擋住選項, 所以先擋掉, 等使用者自己點搜尋框再放行
function handleInputMounted() {
	input_focusable = false
}

function handleInputPointerDown() {
	input_focusable = true
}

function handleInputFocus(event) {
	if (input_focusable || !is_touch.value) return
	event.target.blur()
}

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
	<ComboboxPortal>
		<ComboboxContent
			data-slot="combobox-content"
			v-bind="forwarded"
			:class="cn('bg-color-1 text-color-10 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 relative z-50 flex max-h-(--reka-combobox-content-available-height) min-w-[var(--reka-combobox-trigger-width)] max-w-(--reka-combobox-content-available-width) flex-col overflow-hidden rounded-md border shadow-md', props.class)"
		>
			<div class="flex shrink-0 items-center gap-2 border-b px-3">
				<Search class="size-4 shrink-0 text-color-5" />
				<ComboboxInput
					class="placeholder:text-color-5 h-9 w-full min-w-0 bg-transparent text-base outline-none md:text-sm"
					:placeholder="searchPlaceholder"
					:display-value="() => ''"
					@vue:mounted="handleInputMounted"
					@pointerdown="handleInputPointerDown"
					@focus="handleInputFocus"
				/>
			</div>
			<ComboboxViewport class="p-1">
				<ComboboxEmpty class="text-color-6 px-2 py-4 text-center text-sm">{{ emptyText }}</ComboboxEmpty>
				<div
					@pointerdown.capture="handlePointerDown"
					@pointerup.capture="handlePointerUp"
					@pointercancel.capture="handlePointerCancel"
				>
					<slot />
				</div>
			</ComboboxViewport>
		</ComboboxContent>
	</ComboboxPortal>
</template>
