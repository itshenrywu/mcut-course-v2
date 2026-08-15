<script setup>
import { computed, watch } from 'vue'
import { useMediaQuery, useScrollLock } from '@vueuse/core'
import { trackOverlay } from '@/lib/overlay'

const DRAWER_BASE = 'fixed inset-x-0 bottom-0 z-50 flex max-h-[85dvh] flex-col rounded-t-xl border-t bg-color-2 transition-transform lg:hidden print:hidden'
const DRAWER_OPEN = 'translate-y-0'
const DRAWER_CLOSED = 'translate-y-full'

const open = defineModel('open', { type: Boolean, default: false })

// 手機抽屜打開時鎖住背景頁面捲動; 開著時放大到 lg 會切回一般側邊欄, 要跟著解鎖
const is_desktop = useMediaQuery('(min-width: 64rem)')
const body_locked = useScrollLock(document.body)

watch([open, is_desktop], ([is_open, desktop]) => {
	body_locked.value = is_open && !desktop
})

trackOverlay(computed(() => open.value && !is_desktop.value))
</script>

<template>
	<!-- PC -->
	<aside class="hidden w-60 shrink-0 lg:block lg:border-r lg:pr-4 print:hidden">
		<div class="sticky top-[calc(var(--nav-h)+1rem)] flex h-[calc(100dvh-var(--nav-h)-var(--footer-h)-1.5rem)] flex-col gap-6 overflow-y-auto overscroll-contain -ml-2 px-2">
			<slot />

			<div v-if="$slots.footer" class="mt-auto flex shrink-0 justify-start pb-1 pt-2">
				<slot name="footer" />
			</div>
		</div>
	</aside>

	<!-- Mobile -->
	<div v-if="open" class="fixed inset-0 z-50 bg-black/50 lg:hidden print:hidden" @click="open = false"></div>
	<aside :class="[DRAWER_BASE, open ? DRAWER_OPEN : DRAWER_CLOSED]">
		<div class="flex-1 overflow-y-auto overscroll-contain p-4">
			<slot />
		</div>

		<div v-if="$slots.footer" class="flex shrink-0 justify-end px-4 pb-4">
			<slot name="footer" />
		</div>
	</aside>
</template>
