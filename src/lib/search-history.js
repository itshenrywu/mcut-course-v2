import { ref } from 'vue'
import { readJsonItem, writeJsonItem } from '@/lib/storage'

const MAX_HISTORY = 10

function normalizeList(list) {
	return list.filter(item => typeof item === 'string' && item.trim()).map(item => item.trim()).slice(0, MAX_HISTORY)
}

const search_history = ref(normalizeList(readJsonItem('mcv2-search-history', [], Array.isArray)))

function save() {
	writeJsonItem('mcv2-search-history', search_history.value)
}

function addSearchHistory(keyword) {
	const value = String(keyword || '').trim()
	if (!value) return
	search_history.value = [value, ...search_history.value.filter(item => item !== value)].slice(0, MAX_HISTORY)
	save()
}

function removeSearchHistory(keyword) {
	search_history.value = search_history.value.filter(item => item !== keyword)
	save()
}

function clearSearchHistory() {
	search_history.value = []
	save()
}

export function useSearchHistory() {
	return { search_history, addSearchHistory, removeSearchHistory, clearSearchHistory }
}
