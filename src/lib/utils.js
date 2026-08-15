import { ref, watch, toValue, onScopeDispose } from 'vue'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

const DEBOUNCE_DELAY = 250

// CJK 與英數字之間補空格用的字元範圍與 regex
const CJK = '\\u2e80-\\u2fff\\u3040-\\u30ff\\u3400-\\u4dbf\\u4e00-\\u9fff\\uf900-\\ufaff'
const CJK_BEFORE_WORD = new RegExp(`([${CJK}])([A-Za-z0-9])`, 'g')
const WORD_BEFORE_CJK = new RegExp(`([A-Za-z0-9])([${CJK}])`, 'g')

export function useDebouncedRef(source, delay = DEBOUNCE_DELAY) {
	const debounced = ref(source.value)
	let timer = null
	watch(source, value => {
		clearTimeout(timer)
		if (!value) {
			debounced.value = value
			return
		}
		timer = setTimeout(() => {
			debounced.value = value
		}, delay)
	})
	onScopeDispose(() => clearTimeout(timer))
	return debounced
}

export function cn(...inputs) {
	return twMerge(clsx(inputs))
}

export function useValidOption(model, options, config = {}) {
	const { fallback = 'any', enabled } = config
	watch([() => toValue(options), () => enabled ? toValue(enabled) : true], ([list, ok]) => {
		if (!ok) return
		if (model.value !== fallback && !list.includes(model.value)) model.value = fallback
	}, { immediate: true })
}

export function schoolTel(ext) {
	return { href: `tel:0229089899,${ext}`, text: `(02) 2908-9899 #${ext}` }
}

export function parseRowFields(row, fields) {
	const item = {}
	for (const [index, field] of fields.entries()) item[field] = ((row || [])[index] || '').trim()
	return item
}

export function cleanText(value) {
	return String(value || '').replace(/\r\n?/g, '\n').trim()
}

export function cellClass(value) {
	return value ? 'text-color-8' : 'text-color-5'
}

export function cellText(value) {
	return value || '—'
}

let root_font_size_cache = 0

function rootFontSize() {
	if (!root_font_size_cache) {
		root_font_size_cache = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16
	}
	return root_font_size_cache
}

if (typeof window !== 'undefined') {
	window.addEventListener('resize', () => {
		root_font_size_cache = 0
	})
}

export function remToPx(rem) {
	return rem * rootFontSize()
}

export function spaceText(text) {
	return (text || '')
		.replace(CJK_BEFORE_WORD, '$1 $2')
		.replace(WORD_BEFORE_CJK, '$1 $2')
}

export function formatDateTime(time, pattern) {
	const date = new Date(time)
	const pad = value => String(value).padStart(2, '0')
	return pattern
		.replace('YYYY', date.getFullYear())
		.replace('MM', pad(date.getMonth() + 1))
		.replace('DD', pad(date.getDate()))
		.replace('HH', pad(date.getHours()))
		.replace('mm', pad(date.getMinutes()))
		.replace('ss', pad(date.getSeconds()))
}

export function parseTime(text) {
	if (!text) return 0
	const value = String(text).trim()
	if (/^\d+$/.test(value)) {
		const number = Number(value)
		// 小於 1e11 視為 unix 秒, 否則視為毫秒
		return number < 1e11 ? number * 1000 : number
	}
	const normalized = /^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T00:00:00` : value.replace(' ', 'T')
	const time = new Date(normalized).getTime()
	return Number.isNaN(time) ? 0 : time
}

export function isInTimeRange(item) {
	const now = Date.now()
	const start = parseTime(item?.start)
	const end = parseTime(item?.end)
	if (start && now < start) return false
	if (end && now > end) return false
	return true
}
