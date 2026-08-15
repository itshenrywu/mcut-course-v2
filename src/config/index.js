const API_BASE = import.meta.env?.API_BASE || ''

export const API_BASE_URL = `${API_BASE}/api`
export const AUTH_BASE_URL = `${API_BASE}/auth`
export const OG_BASE_URL = `${API_BASE}/og`

export function ogImagePath(path) {
	return `${path === '/' ? '/index' : path}.jpg`
}

export function ogImageUrl(path, build_time, base_url = OG_BASE_URL) {
	return `${base_url}${ogImagePath(path)}?t=${build_time}`
}