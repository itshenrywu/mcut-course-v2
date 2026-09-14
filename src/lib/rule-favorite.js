import { ref } from 'vue'
import { getRuleFavorite, patchRuleFavorite } from '@/api/user'
import { useAuth } from '@/lib/auth'
import { createSync } from '@/lib/sync'
import { findRule, parseRuleFavoriteId, ruleFavoriteId } from '@/lib/rule-format'
import { readJsonItem, writeJsonItem } from '@/lib/storage'

export const RULE_FAVORITE_MAX = 20

const ID_PATTERN = /^\d+-\w+-\w+$/

const { is_logged_in } = useAuth()

function normalizeList(list) {
	const out = []
	const seen = new Set()
	for (const item of list) {
		const id = String(item)
		if (!ID_PATTERN.test(id) || seen.has(id)) continue
		seen.add(id)
		out.push(id)
	}
	return out
}

const rule_favorite_ids = ref(normalizeList(readJsonItem('mcv2-rule-favorites', [], Array.isArray)))

let pending_add = new Set()
let pending_remove = new Set()

function loadPending() {
	const data = readJsonItem('mcv2-rule-favorite-pending', {})
	pending_add = new Set(Array.isArray(data.add) ? data.add : [])
	pending_remove = new Set(Array.isArray(data.remove) ? data.remove : [])
}

function savePending() {
	writeJsonItem('mcv2-rule-favorite-pending', { add: [...pending_add], remove: [...pending_remove] })
}

function markPending(id, added) {
	if (added) {
		pending_remove.delete(id)
		pending_add.add(id)
	} else {
		pending_add.delete(id)
		pending_remove.add(id)
	}
}

function markSynced() {
	localStorage.setItem('mcv2-rule-favorite-synced', '1')
}

function clearSyncState() {
	pending_add = new Set()
	pending_remove = new Set()
	localStorage.removeItem('mcv2-rule-favorite-pending')
	localStorage.removeItem('mcv2-rule-favorite-synced')
}

function saveLocal(next) {
	rule_favorite_ids.value = next
	writeJsonItem('mcv2-rule-favorites', next)
}

function hasPending() {
	return Boolean(pending_add.size || pending_remove.size)
}

async function push(token) {
	const sent_add = [...pending_add]
	const sent_remove = [...pending_remove]
	await patchRuleFavorite(token, { add: sent_add, remove: sent_remove })
	for (const id of sent_add) pending_add.delete(id)
	for (const id of sent_remove) pending_remove.delete(id)
	savePending()
}

function queueDelta(add, remove) {
	for (const id of add) markPending(id, true)
	for (const id of remove) markPending(id, false)
	savePending()
	return pushPending()
}

function commit(next) {
	if (is_logged_in.value) {
		const before = new Set(rule_favorite_ids.value)
		const after = new Set(next)
		for (const id of next) {
			if (!before.has(id)) markPending(id, true)
		}
		for (const id of before) {
			if (!after.has(id)) markPending(id, false)
		}
		savePending()
	}
	saveLocal(next)
	schedulePush()
}

// 總表收藏只是捷徑清單, 首次登入直接聯集不問使用者; 課程收藏會影響學分與衝堂才需要 FavoriteSyncDialog
async function applyRemote(data) {
	const remote = normalizeList(Array.isArray(data?.rule_favorite) ? data.rule_favorite : [])

	if (localStorage.getItem('mcv2-rule-favorite-synced') !== '1') {
		markSynced()
		const local = rule_favorite_ids.value
		const merged = normalizeList([...remote, ...local])
		saveLocal(merged)
		return queueDelta(merged.filter(id => !remote.includes(id)), [])
	}

	const next = normalizeList([
		...remote.filter(id => !pending_remove.has(id)),
		...pending_add
	])
	saveLocal(next)
	return pushPending()
}

function onLogout() {
	clearSyncState()
}

const { syncing, sync_error, schedulePush, pushPending, resync, start } = createSync({
	error_title: '總表收藏同步失敗',
	hasPending,
	push,
	fetchRemote: getRuleFavorite,
	applyRemote,
	onLogout
})

export function startRuleFavoriteSync() {
	loadPending()
	return start()
}

export function resyncRuleFavorite() {
	return resync()
}

// 上限只算解析得到的, 已下架的不佔額度; 呼叫端要自己給總表清單, 這個模組拿不到 (useRuleList 每次呼叫都是新的 loader)
export function countRuleFavorites(rule_map, dept_map) {
	let count = 0
	for (const id of rule_favorite_ids.value) {
		const parsed = parseRuleFavoriteId(id)
		if (parsed && findRule(rule_map, dept_map, parsed.year, parsed.dept_id, parsed.rule_id)) count++
	}
	return count
}

export function useRuleFavoriteSync() {
	return { syncing, sync_error }
}

export function useRuleFavorite() {
	function isRuleFavorite(year, dept_id, rule_id) {
		const id = ruleFavoriteId(year, dept_id, rule_id)
		return Boolean(id) && rule_favorite_ids.value.includes(id)
	}

	function toggleRuleFavorite(year, dept_id, rule_id) {
		const id = ruleFavoriteId(year, dept_id, rule_id)
		if (!id) return ''
		const added = !rule_favorite_ids.value.includes(id)
		commit(added
			? [...rule_favorite_ids.value, id]
			: rule_favorite_ids.value.filter(item => item !== id))
		return added ? 'added' : 'removed'
	}

	function removeRuleFavorite(id) {
		commit(rule_favorite_ids.value.filter(item => item !== id))
	}

	return { rule_favorite_ids, isRuleFavorite, toggleRuleFavorite, removeRuleFavorite }
}
