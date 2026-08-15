import { computed } from 'vue'
import { useMediaQuery } from '@vueuse/core'
import { Monitor, Smartphone } from '@lucide/vue'

// 用指標粗細而非視窗寬度判斷, 桌機把視窗拉窄時不會被誤判成手機
const is_touch = useMediaQuery('(pointer: coarse)')

const device_icon = computed(() => (is_touch.value ? Smartphone : Monitor))

export function useDevice() {
	return { is_touch, device_icon }
}
