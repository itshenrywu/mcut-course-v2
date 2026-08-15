import { route_loading } from '@/lib/route-loading'

const START_DELAY = 1000
const CHUNK_DELAY = 250
const BUSY_DELAY = 1500
const IDLE_TIMEOUT = 5000
const PRIORITY_NAMES = ['course', 'favorite', 'my', 'rule', 'more', 'course-detail']

function allowPrefetch() {
	const connection = navigator.connection
	if (!connection) return true
	if (connection.saveData) return false
	return !/2g/.test(connection.effectiveType || '')
}

function prefetchQueue(router) {
	const list = []
	for (const record of router.getRoutes()) {
		const loader = record.components?.default
		if (typeof loader === 'function') list.push({ name: String(record.name || record.path), record, loader })
	}
	const rank = item => {
		const index = PRIORITY_NAMES.indexOf(item.name)
		return index === -1 ? PRIORITY_NAMES.length : index
	}
	return list.sort((a, b) => rank(a) - rank(b))
}

export function startRoutePrefetch(router) {
	if (!allowPrefetch()) return () => {}
	const queue = prefetchQueue(router)
	let timer = null
	let stopped = false

	const schedule = delay => {
		timer = setTimeout(() => {
			if (window.requestIdleCallback) requestIdleCallback(next, { timeout: IDLE_TIMEOUT })
			else next()
		}, delay)
	}

	const next = () => {
		if (stopped) return
		if (route_loading.value) return schedule(BUSY_DELAY)
		const item = queue.shift()
		if (!item) return
		Promise.resolve()
			.then(item.loader)
			.then(module => {
				const component = module?.default || module
				if (component && typeof item.record.components?.default === 'function') item.record.components.default = component
			})
			.catch(() => {})
			.then(() => {
				if (!stopped) schedule(CHUNK_DELAY)
			})
	}

	const start = () => schedule(START_DELAY)
	if (document.readyState === 'complete') start()
	else window.addEventListener('load', start, { once: true })

	return () => {
		stopped = true
		clearTimeout(timer)
		window.removeEventListener('load', start)
	}
}
