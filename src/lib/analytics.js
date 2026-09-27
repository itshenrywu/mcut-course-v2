const GA_PARAM_MAX = 100

let last_path = ''

// SPA 換頁不會重算 INP, 要記下每次換頁的時間才知道互動發生在哪一頁
const route_log = [[0, location.pathname]]

export function sendPageView(path) {
	if (typeof gtag !== 'function') return
	if (path === last_path) return
	last_path = path
	gtag('event', 'page_view', {
		page_path: path,
		page_title: document.title,
		page_location: window.location.href
	})
}

export function logRoutePath(path) {
	route_log.push([performance.now(), path])
}

function pathAt(time) {
	let path = route_log[0][1]
	for (const [at, route_path] of route_log) {
		if (at > time) break
		path = route_path
	}
	return path
}

function gaText(value) {
	return String(value ?? '').slice(0, GA_PARAM_MAX)
}

function scriptSource(url) {
	if (!url) return ''
	try {
		const { host, pathname } = new URL(url)
		return `${host}/${pathname.split('/').pop()}`
	} catch {
		return url
	}
}

function sendInp({ id, value, delta, rating, attribution }) {
	const script = attribution.longestScript?.entry
	gtag('event', 'INP', {
		value: Math.round(delta),
		metric_id: id,
		metric_value: Math.round(value),
		metric_rating: rating,
		debug_target: gaText(attribution.interactionTarget),
		debug_type: attribution.interactionType || '',
		debug_load_state: attribution.loadState || '',
		debug_input_delay: Math.round(attribution.inputDelay || 0),
		debug_processing: Math.round(attribution.processingDuration || 0),
		debug_presentation: Math.round(attribution.presentationDelay || 0),
		debug_style_layout: Math.round(attribution.totalStyleAndLayoutDuration || 0),
		debug_script_src: gaText(scriptSource(script?.sourceURL)),
		debug_script_invoker: gaText(script?.invoker),
		debug_script_subpart: attribution.longestScript?.subpart || '',
		landing_path: gaText(route_log[0][1]),
		interaction_path: gaText(pathAt(attribution.interactionTime))
	})
}

export function trackInp() {
	if (typeof gtag !== 'function') return
	import('web-vitals/attribution/onINP.js')
		.then(({ onINP }) => onINP(sendInp))
		.catch(error => console.error(error))
}
