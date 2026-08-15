import { defineAsyncComponent, ref } from 'vue'

export const toaster_enabled = ref(false)

export const Toaster = defineAsyncComponent(() => import('./Sonner.vue'))

let resolve_ready
const toaster_ready = new Promise(resolve => {
	resolve_ready = resolve
})

export function markToasterReady() {
	resolve_ready()
}

async function callToast(method, args) {
	toaster_enabled.value = true
	const { toast: real_toast } = await import('vue-sonner')
	await toaster_ready
	return method ? real_toast[method](...args) : real_toast(...args)
}

export const toast = (...args) => callToast(null, args)

// vue-sonner 的 toast 方法, 用來產生延後讀取的代理
for (const method of ['success', 'error', 'warning', 'info', 'message', 'loading', 'promise', 'custom', 'dismiss']) toast[method] = (...args) => callToast(method, args)
