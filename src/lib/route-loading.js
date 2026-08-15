import { ref } from 'vue'

export const route_loading = ref(false)

let timer = null

export function startRouteLoading(immediate) {
	clearRouteLoading()
	if (immediate) {
		route_loading.value = true
		return
	}
	timer = setTimeout(() => {
		route_loading.value = true
	}, 200)
}

export function clearRouteLoading() {
	clearTimeout(timer)
	timer = null
	route_loading.value = false
}
