import { recordLoadError } from '@/lib/report'

const CACHE_TTL_MS = 10 * 60 * 1000
const CACHE_MAX_SIZE = 30

const cache_map = new Map()

export async function fetchJson(url, label = '資料', options = {}) {
	const { parse = 'json', ...init } = options
	const method = init.method || 'GET'
	let response
	try {
		response = await fetch(url, init)
	} catch (error) {
		recordLoadError(method, url, 0, error.message)
		throw error
	}
	if (!response.ok) {
		recordLoadError(method, url, response.status)
		const error = new Error(`下載${label}失敗: ${response.status}`)
		error.status = response.status
		throw error
	}
	return parse === 'text' ? response.text() : response.json()
}

export function cachedFetch(key, url, options = {}) {
	const { force = false, label = '資料', parse = 'json' } = options
	const entry = cache_map.get(key)
	if (entry) {
		const in_flight = !entry.settled_at
		const fresh = !force && Date.now() - entry.settled_at < CACHE_TTL_MS
		if (in_flight || fresh) {
			cache_map.delete(key)
			cache_map.set(key, entry)
			return entry.promise
		}
	}
	const new_entry = { settled_at: 0 }
	new_entry.promise = fetchJson(url, label, { parse }).then(data => {
		new_entry.settled_at = Date.now()
		return data
	}, error => {
		if (cache_map.get(key) === new_entry) cache_map.delete(key)
		throw error
	})
	cache_map.set(key, new_entry)
	if (cache_map.size > CACHE_MAX_SIZE) cache_map.delete(cache_map.keys().next().value)
	return new_entry.promise
}
