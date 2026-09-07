import { computed, ref, watch } from 'vue'
import { useDevice } from '@/composables/useDevice'

const PANEL_MARGIN_RATIO = 0.1
const TOUCH_SCROLL_THRESHOLD = 10

// reka 的 bodyLock 與 dialog 的 DismissableLayer 都會把 body 設成 pointer-events: none, 遮罩與面板都會跟著繼承.
// 面板繼承了就點不動也捲不動; 遮罩繼承了則是觸控會直接穿透到底下的 html,
// iOS 的 body 光靠 overflow: hidden 鎖不住, reka 的 touchmove 攔截又會因為找到可捲的 html 而放行, 背景就跟著滑動.
// 遮罩另外自己擋掉 touchmove, 不然擋不擋得住要看 reka 往上找可捲祖先時剛好撞到 body, 太吃 portal 的位置
export const DROPDOWN_OVERLAY_CLASS = 'animate-in fade-in-0 pointer-events-auto fixed inset-0 z-50 bg-black/50'

export const DROPDOWN_PANEL_CLASS = 'pointer-events-auto flex max-h-full w-full max-w-sm flex-col overflow-hidden rounded-lg shadow-lg'

// 置中框: 上下界由 JS 依 visualViewport 寫進 CSS 變數, 樣式本體在 index.css (Select 的 popper wrapper 也吃同一組)
export const DROPDOWN_CENTER_CLASS = 'dropdown-center'

const viewport_height = ref(0)
const viewport_top = ref(0)
const layout_height = ref(0)

function syncViewport() {
	const view = window.visualViewport
	layout_height.value = window.innerHeight
	viewport_height.value = view ? view.height : window.innerHeight
	viewport_top.value = view ? view.offsetTop : 0
	const margin = Math.round(viewport_height.value * PANEL_MARGIN_RATIO)
	const visible_bottom = viewport_top.value + viewport_height.value
	const root = document.documentElement.style
	root.setProperty('--dropdown-top', `${Math.round(viewport_top.value) + margin}px`)
	root.setProperty('--dropdown-bottom', `${Math.round(layout_height.value - visible_bottom) + margin}px`)
}

syncViewport()
window.visualViewport?.addEventListener('resize', syncViewport)
window.visualViewport?.addEventListener('scroll', syncViewport)
window.addEventListener('resize', syncViewport)

// 觸控裝置一律改成獨立面板: popper 只拿得到 trigger 到視窗邊緣那一段高度,
// 而手機的篩選抽屜與 dialog 都是從下半部升起, 選單常常只剩三四項放得下.
// 選項少到不值得蓋滿畫面的地方傳 floating, 就回到原本貼著 trigger 的浮層
export function useFullscreenDropdown(props) {
	const { is_touch } = useDevice()
	return computed(() => is_touch.value && !props.floating)
}

// 面板的可用範圍吃 visualViewport 而不是 dvh: 鍵盤彈出時 dvh 不會變, 面板下半部會整段躲到鍵盤後面.
// 位置交給 index.css 那個 flex 置中框, 不自己算 top —— 面板高度隨選項數與搜尋結果一直在變,
// 而 height:fit-content 配 flex-1 的子元素在 WebKit 上會算成 0, 面板會塌成一條線

// 開啟時把已選的項目捲進可視範圍並置中.
// 一律走 offsetTop 而不是 getBoundingClientRect: 開場的 zoom-in 動畫還在跑, 量到的矩形會帶著縮放而算出偏移不足的位置.
// 也不用 scrollIntoView —— 那會把每一層可捲的祖先都捲一遍, 背景會跟著跑掉
function offsetWithin(item, container) {
	let offset = 0
	let node = item
	while (node && node !== container) {
		offset += node.offsetTop
		node = node.offsetParent
	}
	return node === container ? offset : null
}

export function useDropdownScrollToSelected(active, viewport_selector) {
	let user_took_over = false

	function markUserTakeover() {
		user_took_over = true
	}

	function scrollToSelected() {
		const viewport = document.querySelector(viewport_selector)
		const item = viewport?.querySelector('[data-state=checked]')
		if (!item) return
		const offset = offsetWithin(item, viewport)
		if (offset === null) return
		viewport.scrollTop = offset - (viewport.clientHeight - item.offsetHeight) / 2
	}

	// 連做兩幀: 第一幀時面板可能還在開場動畫或剛換完高度, 第二幀才量得到穩定的 clientHeight
	function scrollSoon() {
		requestAnimationFrame(() => {
			scrollToSelected()
			requestAnimationFrame(scrollToSelected)
		})
	}

	watch(active, value => {
		user_took_over = false
		if (!value) return
		scrollSoon()
		requestAnimationFrame(() => {
			const viewport = document.querySelector(viewport_selector)
			viewport?.addEventListener('pointerdown', markUserTakeover, { once: true, passive: true })
			viewport?.addEventListener('wheel', markUserTakeover, { once: true, passive: true })
		})
	}, { flush: 'post' })

	// 搜尋框一 focus 鍵盤就升起來, 面板跟著變矮, 剛剛置中的項目又被擠出可視範圍, 所以高度變了要重算.
	// 判斷「使用者是否已經自己接手」看的是他有沒有碰過清單, 而不是比對 scrollTop ——
	// iOS 的捲動容器設完 scrollTop 不保證立刻讀得到新值, 拿它比對會誤判成使用者捲過而不再跟隨
	watch(viewport_height, () => {
		if (!active.value || user_took_over) return
		scrollSoon()
	})
}

// 手指滑動捲清單時不要當成選取.
// SelectItem 選在 pointerup, ComboboxItem 選在 click, 兩個都要擋:
// 捲動成立時瀏覽器多半不會補 click, 但捲動一旦沒被辨識 (手指離開可捲區, 或清單短到捲不動) 就會補,
// 只擋 pointerup 的話 Combobox 會變成碰到就選
export function useDropdownTouchGuard() {
	let start_pos = null
	let suppress_click = false

	function onPointerDown(event) {
		suppress_click = false
		start_pos = event.pointerType === 'mouse' ? null : { x: event.clientX, y: event.clientY }
	}

	function onPointerUp(event) {
		const start = start_pos
		start_pos = null
		if (!start) return
		const is_scrolling = Math.abs(event.clientX - start.x) > TOUCH_SCROLL_THRESHOLD || Math.abs(event.clientY - start.y) > TOUCH_SCROLL_THRESHOLD
		if (!is_scrolling) return
		suppress_click = true
		event.stopPropagation()
	}

	function onPointerCancel() {
		start_pos = null
	}

	function onClick(event) {
		if (!suppress_click) return
		suppress_click = false
		event.stopPropagation()
		event.preventDefault()
	}

	return { onPointerDown, onPointerUp, onPointerCancel, onClick }
}
