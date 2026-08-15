import { computed, onScopeDispose, ref, watch } from 'vue'

// 彈層關閉動畫時間, 取各彈層中最長的 (dialog/drawer 200ms, 篩選抽屜 150ms)
const CLOSE_DELAY_MS = 200

const open_count = ref(0)

export const overlay_open = computed(() => open_count.value > 0)

export function trackOverlay(open) {
	let counted = false
	let timer = null

	function setCounted(value) {
		if (value === counted) return
		counted = value
		open_count.value += value ? 1 : -1
	}

	watch(open, value => {
		clearTimeout(timer)
		if (value) {
			setCounted(true)
			return
		}
		if (!counted) return
		timer = setTimeout(() => setCounted(false), CLOSE_DELAY_MS)
	}, { immediate: true })

	onScopeDispose(() => {
		clearTimeout(timer)
		setCounted(false)
	})
}
