import { API_BASE_URL } from '@/config'
import { cachedFetch } from '@/api/cache'

export function getInfo(key, options = {}) {
	const { label = `資料 (${key})` } = options
	return cachedFetch(`info/${key}`, `${API_BASE_URL}/info/${key}`, { ...options, label })
}

export function getCalendar(year, month, options = {}) {
	const { label = '行事曆' } = options
	const path = `calendar/${year}/${month}`
	return cachedFetch(`info/${path}`, `${API_BASE_URL}/info/${path}`, { ...options, label })
}

export function getInfoItem(key, id, options = {}) {
	const { label = `資料 (${key})` } = options
	const path = encodeURIComponent(id)
	return cachedFetch(`info/${key}/${path}`, `${API_BASE_URL}/info/${key}/${path}`, { ...options, label })
}
