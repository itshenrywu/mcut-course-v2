import { ref, computed } from 'vue'
import { getFavorite, patchFavorite } from '@/api/user'
import { getCourseMap } from '@/api/course'
import { useAuth } from '@/lib/auth'
import { createSync } from '@/lib/sync'
import { favoriteCourseId } from '@/lib/course-format'
import { termIdFromCourseId } from '@/lib/term-format'
import { readJsonItem, writeJsonItem } from '@/lib/storage'
import { toast } from '@/components/ui/sonner'

const { is_logged_in } = useAuth()

const favorite_ids = ref(new Set(readJsonItem('mcv2-favorites', [], Array.isArray)))
const remote_ids = ref(new Set())
const remote_last_updated = ref('')
const conflict_open = ref(false)

let pending_add = new Set()
let pending_remove = new Set()

function isSameSet(a, b) {
	if (a.size !== b.size) return false
	for (const id of a) {
		if (!b.has(id)) return false
	}
	return true
}

function loadPending() {
	const data = readJsonItem('mcv2-favorite-pending', {})
	pending_add = new Set(Array.isArray(data.add) ? data.add : [])
	pending_remove = new Set(Array.isArray(data.remove) ? data.remove : [])
}

function savePending() {
	writeJsonItem('mcv2-favorite-pending', { add: [...pending_add], remove: [...pending_remove] })
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
	localStorage.setItem('mcv2-favorite-synced', '1')
}

function clearSyncState() {
	pending_add = new Set()
	pending_remove = new Set()
	localStorage.removeItem('mcv2-favorite-pending')
	localStorage.removeItem('mcv2-favorite-synced')
}

function saveLocal(next) {
	favorite_ids.value = next
	writeJsonItem('mcv2-favorites', [...next])
}

function hasPending() {
	return Boolean(pending_add.size || pending_remove.size)
}

async function push(token) {
	const sent_add = [...pending_add]
	const sent_remove = [...pending_remove]
	await patchFavorite(token, { add: sent_add, remove: sent_remove })
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
		for (const id of next) {
			if (!favorite_ids.value.has(id)) markPending(id, true)
		}
		for (const id of favorite_ids.value) {
			if (!next.has(id)) markPending(id, false)
		}
		savePending()
	}
	saveLocal(next)
	schedulePush()
}

function resolveConflict(ids) {
	conflict_open.value = false
	const next = new Set(ids)
	const remote = remote_ids.value
	markSynced()
	saveLocal(next)
	return queueDelta([...next].filter(id => !remote.has(id)), [...remote].filter(id => !next.has(id)))
}

async function existingFavorites(local, remote) {
	try {
		const map = await getCourseMap([...new Set([...local, ...remote])])
		return [new Set([...local].filter(id => map.has(id))), new Set([...remote].filter(id => map.has(id)))]
	} catch (error) {
		console.error(error)
		return [local, remote]
	}
}

async function applyRemote(data) {
	const remote = new Set(Array.isArray(data?.favorite) ? data.favorite : [])
	const local = favorite_ids.value
	remote_ids.value = remote
	remote_last_updated.value = String(data?.last_updated || '')

	if (localStorage.getItem('mcv2-favorite-synced') !== '1') {
		if (isSameSet(local, remote)) return markSynced()
		const [existing_local, existing_remote] = await existingFavorites(local, remote)
		if (isSameSet(existing_local, existing_remote)) return resolveConflict(existing_local)
		if (!existing_remote.size) return resolveConflict(existing_local)
		if (!existing_local.size) return resolveConflict(existing_remote)
		conflict_open.value = true
		return
	}

	const next = new Set(remote)
	for (const id of pending_add) next.add(id)
	for (const id of pending_remove) next.delete(id)
	saveLocal(next)
	return pushPending()
}

function onLogout() {
	clearSyncState()
	remote_ids.value = new Set()
	remote_last_updated.value = ''
	conflict_open.value = false
}

const { syncing, sync_error, schedulePush, pushPending, resync, start } = createSync({
	error_title: '收藏同步失敗',
	hasPending,
	push,
	fetchRemote: getFavorite,
	applyRemote,
	onLogout
})

export function startFavoriteSync() {
	loadPending()
	return start()
}

export function resyncFavorite() {
	return resync()
}

export function useFavoriteSync() {
	return { remote_ids, remote_last_updated, conflict_open, syncing, sync_error, favorite_ids, resolveConflict }
}

export function useFavorite() {
	function isFavorite(id) {
		return favorite_ids.value.has(id)
	}
	function toggleFavorite(id) {
		const next = new Set(favorite_ids.value)
		if (next.has(id)) next.delete(id)
		else next.add(id)
		commit(next)
	}
	function addFavorites(ids) {
		const next = new Set(favorite_ids.value)
		let added = 0
		for (const id of ids) {
			if (!next.has(id)) added++
			next.add(id)
		}
		commit(next)
		return added
	}
	function removeFavorites(ids) {
		const next = new Set(favorite_ids.value)
		let removed = 0
		for (const id of ids) {
			if (next.delete(id)) removed++
		}
		commit(next)
		return removed
	}
	function replaceFavorites(id_pairs) {
		const next = new Set(favorite_ids.value)
		let replaced = 0
		for (const [from_id, to_id] of id_pairs) {
			if (!next.delete(from_id)) continue
			next.add(to_id)
			replaced++
		}
		if (replaced) commit(next)
		return replaced
	}
	return { favorite_ids, isFavorite, toggleFavorite, addFavorites, removeFavorites, replaceFavorites }
}

export function useFavoriteTermCount() {
	const favorite_count_map = computed(() => {
		const map = new Map()
		for (const id of favorite_ids.value) {
			const term_id = termIdFromCourseId(id)
			map.set(term_id, (map.get(term_id) || 0) + 1)
		}
		return map
	})

	const term_description_map = computed(() => {
		const map = {}
		for (const [term_id, count] of favorite_count_map.value) map[term_id] = `${count} 門`
		return map
	})

	return { favorite_count_map, term_description_map }
}

export function useFavoriteToggle() {
	const { isFavorite, toggleFavorite } = useFavorite()

	function isCourseFavorite(course) {
		return !!course && isFavorite(favoriteCourseId(course))
	}

	function favoriteLabel(course, conflict = false) {
		if (!course) return ''
		const action = isCourseFavorite(course) ? '取消收藏' : '收藏'
		if (conflict) return `${action} ${course.name}（與已收藏課程衝堂）`
		return `${action} ${course.name}`
	}

	function toggleCourseFavorite(course) {
		if (!course) return
		const added = !isCourseFavorite(course)
		toggleFavorite(favoriteCourseId(course))
		toast.success(added ? '課程已收藏' : '課程已取消收藏', {
			description: course.name
		})
	}

	return { isCourseFavorite, favoriteLabel, toggleCourseFavorite }
}
