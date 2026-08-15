import { ref } from 'vue'

// App 內建瀏覽器的 UA 特徵 (LINE / Facebook / Messenger / Instagram / Threads / WeChat / Google App)
const IN_APP_PATTERN = /Line\/|FBAN|FBAV|FB_IAB|Instagram|Threads|MicroMessenger|GSA\//

// 開站後延遲多久才滑出, 等首屏畫完 (或條款彈窗收起) 再提醒, 免得兩個彈窗疊在一起
const HINT_DELAY = 600

const hint_open = ref(false)

let hinted = false

export function isInAppBrowser() {
	return IN_APP_PATTERN.test(navigator.userAgent)
}

function isDismissed() {
	return localStorage.getItem('mcv2-in-app-hint-off') === '1'
}

export function startInAppBrowserHint() {
	if (hinted || isDismissed() || !isInAppBrowser()) return
	hinted = true
	const timer = setTimeout(() => hint_open.value = true, HINT_DELAY)
	return () => clearTimeout(timer)
}

export function dismissInAppBrowserHint() {
	localStorage.setItem('mcv2-in-app-hint-off', '1')
}

export function useInAppBrowserHint() {
	return { hint_open }
}
