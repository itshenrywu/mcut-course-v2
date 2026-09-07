<script setup>
import { computed } from 'vue'
import { ComboboxContent, ComboboxEmpty, ComboboxInput, ComboboxPortal, ComboboxViewport, injectComboboxRootContext, useForwardPropsEmits } from 'reka-ui'
import { reactiveOmit } from '@vueuse/core'
import { Search } from '@lucide/vue'
import { cn } from '@/lib/utils'
import { trackOverlay } from '@/lib/overlay'
import { DROPDOWN_CENTER_CLASS, DROPDOWN_OVERLAY_CLASS, DROPDOWN_PANEL_CLASS, useDropdownScrollToSelected, useDropdownTouchGuard, useFullscreenDropdown } from '@/lib/dropdown'
import { useDevice } from '@/composables/useDevice'

const VIEWPORT_PADDING = 36

const BASE_CLASS = 'bg-color-1 text-color-10 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 z-50 flex flex-col overflow-hidden rounded-md border shadow-md'
const POPPER_CLASS = 'relative max-h-(--reka-combobox-content-available-height) min-w-[var(--reka-combobox-trigger-width)] max-w-(--reka-combobox-content-available-width)'

const props = defineProps({
	position: { type: String, default: 'popper' },
	side: { type: String, required: false },
	sideOffset: { type: Number, default: 4 },
	align: { type: String, default: 'start' },
	alignOffset: { type: Number, required: false },
	collisionPadding: { type: null, default: () => ({ top: VIEWPORT_PADDING, bottom: VIEWPORT_PADDING }) },
	searchPlaceholder: { type: String, default: '搜尋' },
	emptyText: { type: String, default: '找不到符合的項目' },
	floating: { type: Boolean, default: false },
	class: { type: null, default: '' }
})
const emits = defineEmits(['escapeKeyDown', 'pointerDownOutside'])

const delegated_props = reactiveOmit(props, 'class', 'searchPlaceholder', 'emptyText', 'floating', 'position')
const forwarded = useForwardPropsEmits(delegated_props, emits)

const { is_touch } = useDevice()
const is_fullscreen = useFullscreenDropdown(props)

const root_context = injectComboboxRootContext()

const overlay_open = computed(() => is_fullscreen.value && root_context.open.value)

trackOverlay(overlay_open)
useDropdownScrollToSelected(overlay_open, '[data-reka-combobox-viewport]')

let input_focusable = false

const touch_guard = useDropdownTouchGuard()

// reka 開啟時會強制 focus 搜尋框, 觸控裝置上鍵盤會彈出來擋住選項, 所以先擋掉, 等使用者自己點搜尋框再放行;
// 全螢幕版的清單在鍵盤上方還看得到, 就讓它照 reka 原本的行為直接進入可打字狀態
function handleInputMounted() {
	input_focusable = false
}

function handleInputPointerDown() {
	input_focusable = true
}

function handleInputFocus(event) {
	if (input_focusable || !is_touch.value || is_fullscreen.value) return
	event.target.blur()
}
</script>

<template>
	<ComboboxPortal>
		<div v-if="overlay_open" data-slot="dropdown-overlay" :class="DROPDOWN_OVERLAY_CLASS" @touchmove.prevent></div>
		<div :class="is_fullscreen ? DROPDOWN_CENTER_CLASS : ''">
			<ComboboxContent
				data-slot="combobox-content"
				v-bind="forwarded"
				:position="is_fullscreen ? 'inline' : position"
				:body-lock="is_fullscreen"
				:class="cn(BASE_CLASS, is_fullscreen ? [DROPDOWN_PANEL_CLASS, 'h-full'] : POPPER_CLASS, props.class)"
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
				<ComboboxViewport class="relative min-h-0 overscroll-contain p-1">
					<ComboboxEmpty :class="cn('text-color-6 px-2 py-4 text-center text-sm', is_fullscreen && 'flex h-full items-center justify-center')">{{ emptyText }}</ComboboxEmpty>
					<div
						@pointerdown.capture="touch_guard.onPointerDown"
						@pointerup.capture="touch_guard.onPointerUp"
						@pointercancel.capture="touch_guard.onPointerCancel"
						@click.capture="touch_guard.onClick"
					>
						<slot />
					</div>
				</ComboboxViewport>
			</ComboboxContent>
		</div>
	</ComboboxPortal>
</template>
