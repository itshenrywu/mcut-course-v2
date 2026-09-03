export function trackFocusModality() {
	const root = document.documentElement
	let is_keyboard = false
	window.addEventListener('keydown', event => {
		if (event.metaKey || event.ctrlKey || event.altKey) return
		is_keyboard = true
	}, { capture: true, passive: true })
	window.addEventListener('pointerdown', () => {
		is_keyboard = false
	}, { capture: true, passive: true })
	/* 屬性只在 focusin 寫入, 不能直接掛在上面兩個 listener 上:
	   焦點框要在「取得焦點的當下」就定案並維持到失焦, 否則滑鼠點進輸入框後一開始打字就會翻成鍵盤模式而冒出框.
	   Tab 與點擊都是先發 keydown/pointerdown 才移動焦點, focusin 讀到的一定是這次操作的方式 */
	window.addEventListener('focusin', () => {
		root.toggleAttribute('data-keyboard', is_keyboard)
	}, { capture: true, passive: true })
}
