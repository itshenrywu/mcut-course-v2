<script setup>
import { ref, watch, onMounted, onUnmounted, defineAsyncComponent } from 'vue'
import { RouterView, useRouter } from 'vue-router'
import NavMenu from '@/components/NavMenu.vue'
import TextLink from '@/components/TextLink.vue'
import AnnouncementBanner from '@/components/AnnouncementBanner.vue'
import BreakpointIndicator from '@/components/BreakpointIndicator.vue'
import LoadingOverlay from '@/components/LoadingOverlay.vue'
import ThemeToggle from '@/components/ThemeToggle.vue'
import { Toaster, toaster_enabled } from '@/components/ui/sonner'
import { route_loading } from '@/lib/route-loading'
import { startRoutePrefetch } from '@/lib/route-prefetch'
import { loadPreInfo } from '@/lib/pre'
import { startFavoriteSync, useFavoriteSync } from '@/lib/favorite'
import { startMyCourseSync } from '@/lib/my-course-sync'
import { startInAppBrowserHint, useInAppBrowserHint } from '@/lib/in-app-browser'
import { useAuth } from '@/lib/auth'

const TermsDialog = defineAsyncComponent(() => import('@/components/TermsDialog.vue'))
const FavoriteSyncDialog = defineAsyncComponent(() => import('@/components/FavoriteSyncDialog.vue'))
const InAppBrowserDrawer = defineAsyncComponent(() => import('@/components/InAppBrowserDrawer.vue'))

const top_nav = ref(null)
const page_footer = ref(null)
const router = useRouter()

let resize_observer = null
let stop_prefetch = null
let stop_in_app_hint = null

const stop_favorite_sync = startFavoriteSync()
const stop_my_course_sync = startMyCourseSync()
const { conflict_open } = useFavoriteSync()
const { hint_open } = useInAppBrowserHint()
const { is_logged_in, loadProfile } = useAuth()

const show_terms = ref(localStorage.getItem('mcv2-terms-agreed') !== '1')
const show_favorite_sync = ref(false)
const show_in_app_hint = ref(false)

watch(conflict_open, open => {
	if (open) show_favorite_sync.value = true
})

watch(hint_open, open => {
	if (open) show_in_app_hint.value = true
})

onMounted(() => {
	resize_observer = new ResizeObserver(entries => {
		for (const entry of entries) {
			const key = entry.target === top_nav.value ? '--nav-h' : '--footer-h'
			document.documentElement.style.setProperty(key, `${(entry.target.offsetHeight - 1)}px`)
		}
	})
	resize_observer.observe(top_nav.value)
	resize_observer.observe(page_footer.value)
	stop_prefetch = startRoutePrefetch(router)
})

onUnmounted(() => {
	resize_observer?.disconnect()
	stop_prefetch?.()
	stop_favorite_sync?.()
	stop_my_course_sync?.()
	stop_in_app_hint?.()
})

function onTermsAgree() {
	stop_in_app_hint = startInAppBrowserHint()
}

loadPreInfo()

if (!show_terms.value) stop_in_app_hint = startInAppBrowserHint()

if (is_logged_in.value) loadProfile()
</script>

<template>
	<div class="flex flex-1 flex-col overflow-x-clip">
		<div ref="top_nav" class="sticky top-0 z-50 print:hidden">
			<AnnouncementBanner />
			<NavMenu />
		</div>
		<main class="flex flex-1 flex-col">
			<RouterView />
		</main>
		<footer ref="page_footer" class="sticky bottom-0 mt-2 border-t bg-color-1 py-1.5 text-center text-xs text-color-6 print:hidden">
			Made by
			<TextLink href="https://henrywu.tw">Henry Wu</TextLink>
		</footer>

		<LoadingOverlay v-if="route_loading" text="頁面讀取中…" />
		<TermsDialog v-if="show_terms" @agree="onTermsAgree()" />
		<FavoriteSyncDialog v-if="show_favorite_sync" />
		<InAppBrowserDrawer v-if="show_in_app_hint" />
		<Toaster v-if="toaster_enabled" />
		<BreakpointIndicator />
		<ThemeToggle />
	</div>
</template>
