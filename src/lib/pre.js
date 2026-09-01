import { ref, computed, watch } from 'vue'
import { getInfo } from '@/api/info'
import { loadAnnouncement } from '@/lib/announcement'
import { readJsonItem, writeJsonItem } from '@/lib/storage'

const pre_map = ref(readJsonItem('mcv2-pre', {}, data => typeof data === 'object' && !Array.isArray(data)))

export const api_sha = ref(localStorage.getItem('mcv2-api-sha') || '')

function savePreMap(data) {
	const map = {}
	for (const [key, value] of Object.entries(data || {})) {
		if (key !== 'announcement' && value && typeof value === 'object') map[key] = value
	}
	api_sha.value = typeof data?.sha === 'string' ? data.sha : ''
	localStorage.setItem('mcv2-api-sha', api_sha.value)
	pre_map.value = map
	writeJsonItem('mcv2-pre', map)
}

async function loadPreMap(options = {}) {
	const { force = false } = options
	try {
		savePreMap(await getInfo('pre', { force, label: '前置資料' }))
	} catch (error) {
		console.error(error)
	}
}

// 同一個 key 可能同時被清單與學號兩種 store 用到, 共用同一份 seen_id 紅點才不會清不掉
const pre_item_map = new Map()

function createPreItem(key, storage_key) {
	const seen_id = ref(localStorage.getItem(storage_key) || '')
	const item = computed(() => pre_map.value[key] || null)
	const has_item = computed(() => Boolean(item.value))
	const item_id = computed(() => String(item.value?.id ?? ''))
	const has_update = computed(() => Boolean(item_id.value) && item_id.value !== seen_id.value)

	function markSeen() {
		if (!item_id.value || item_id.value === seen_id.value) return
		seen_id.value = item_id.value
		localStorage.setItem(storage_key, item_id.value)
	}

	watch(item_id, id => {
		if (id && !seen_id.value) markSeen()
	}, { immediate: true })

	return { item, has_item, item_id, has_update, markSeen }
}

export function usePreItem(key, storage_key) {
	const cache_key = `${key}|${storage_key}`
	if (!pre_item_map.has(cache_key)) pre_item_map.set(cache_key, createPreItem(key, storage_key))
	return pre_item_map.get(cache_key)
}

export function loadPreInfo(options = {}) {
	return Promise.all([loadPreMap(options), loadAnnouncement(options)])
}
