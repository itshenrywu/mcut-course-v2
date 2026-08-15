import { ref, watch } from 'vue'
import { clearBlobs } from '@/lib/image-storage'

// 登出後保留的 localStorage key: 純資料快取與不含個資的顯示偏好
// 未列於此的 mcv2- key 一律清除, 新增 key 時預設會被清掉
const KEEP_KEYS = [
	'mcv2-term-list',
	'mcv2-rev-checked-at',
	'mcv2-announcement',
	'mcv2-selected-term-id',
	'mcv2-search-view',
	'mcv2-favorite-view',
	'mcv2-conflict-mode',
	'mcv2-calendar-view',
	'mcv2-calendar-hidden'
]

export function writeJsonItem(key, value) {
	try {
		localStorage.setItem(key, JSON.stringify(value))
	} catch (error) {
		console.error(error)
	}
}

export function readJsonItem(key, fallback, validate) {
	try {
		const value = JSON.parse(localStorage.getItem(key) ?? 'null')
		if (value != null && (!validate || validate(value))) return value
	} catch {}
	return fallback
}

export function useLocalRef(key, default_value = '', initial, validate) {
	const isValid = v => typeof v === 'string' && (!validate || validate(v))
	const stored = localStorage.getItem(key)
	const has_initial = isValid(initial)
	const value = ref(has_initial ? initial : stored && isValid(stored) ? stored : default_value)
	if (has_initial) localStorage.setItem(key, value.value)
	watch(value, v => localStorage.setItem(key, v))
	return value
}

export function clearOnLogout() {
	clearBlobs()
	for (const key of Object.keys(localStorage)) {
		if (!key.startsWith('mcv2-')) continue
		if (KEEP_KEYS.includes(key)) continue
		localStorage.removeItem(key)
	}
}
