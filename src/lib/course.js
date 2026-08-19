import { ref, shallowRef, computed, watch, onMounted, nextTick, toValue } from 'vue'
import { useDocumentVisibility } from '@vueuse/core'
import { getCourseList, getCourses } from '@/api/course'
import { checkCourseRev } from '@/lib/course-rev'
import { useLatestRequest } from '@/lib/loader'
import { isAltCourse, favoriteCourseId } from '@/lib/course-format'
import { useFavorite } from '@/lib/favorite'
import { useSelectedTerm, termIdFromCourseId, shortTermIdFromCourseId } from '@/lib/term'

export * from '@/lib/course-format'
export { getCourseMap } from '@/api/course'

// 同一個時段被兩門以上收藏課程佔用時的標記 (代表任何課排到這個時段都算衝堂)
const MULTI_OWNER = Symbol('multi_owner')

export async function getCourseBasic(id) {
	const { course_list } = await getCourseList(termIdFromCourseId(id))
	return course_list.find(course => course.id === id) || null
}

function reconcileAltFavorites(course_list) {
	const { favorite_ids, replaceFavorites } = useFavorite()
	const id_pairs = []
	for (const course of course_list) {
		if (!isAltCourse(course)) continue
		if (!favorite_ids.value.has(course.id)) continue
		const target_id = favoriteCourseId(course)
		if (target_id !== course.id) id_pairs.push([course.id, target_id])
	}
	if (id_pairs.length) replaceFavorites(id_pairs)
}

const slot_keys_cache = new WeakMap()

function courseSlotKeys(course) {
	let keys = slot_keys_cache.get(course)
	if (keys) return keys
	keys = []
	const short_term_id = shortTermIdFromCourseId(course.id)
	for (const time of course.time || []) {
		if (!time.day) continue
		for (const section of time.section || []) keys.push(`${short_term_id}-${time.day}-${section}`)
	}
	slot_keys_cache.set(course, keys)
	return keys
}

export function useFavoriteCourses(course_list) {
	const { favorite_ids } = useFavorite()
	return computed(() => {
		const picked = new Map()
		for (const course of toValue(course_list)) {
			const favorite_id = favoriteCourseId(course)
			if (!favorite_ids.value.has(favorite_id)) continue
			const picked_course = picked.get(favorite_id)
			if (picked_course && (isAltCourse(picked_course) || !isAltCourse(course))) continue
			picked.set(favorite_id, course)
		}
		return [...picked.values()]
	})
}

export function useConflictIds(course_list) {
	const { favorite_ids } = useFavorite()
	return computed(() => {
		const list = toValue(course_list)
		const slot_owners = new Map()
		for (const course of list) {
			if (!favorite_ids.value.has(favoriteCourseId(course))) continue
			for (const key of courseSlotKeys(course)) {
				const owner = slot_owners.get(key)
				if (owner === undefined) slot_owners.set(key, course.id)
				else if (owner !== course.id) slot_owners.set(key, MULTI_OWNER)
			}
		}
		const ids = new Set()
		if (!slot_owners.size) return ids
		for (const course of list) {
			for (const key of courseSlotKeys(course)) {
				const owner = slot_owners.get(key)
				if (owner === undefined || owner === course.id) continue
				ids.add(course.id)
				break
			}
		}
		return ids
	})
}

const archived_cache = new Map()

export function useArchivedFavorites(course_list, options = {}) {
	const { loaded, load_error } = options
	const { favorite_ids, removeFavorites } = useFavorite()
	const { selected_term_id } = useSelectedTerm()
	const archived_courses = ref([])
	const archived_loading = ref(false)
	const startRequest = useLatestRequest()

	// 本學期的收藏但不在課程清單裡, 查過才知道是下架還是整門課已經不存在
	const candidate_ids = computed(() => {
		if (!toValue(loaded) || toValue(load_error)) return []
		const list = toValue(course_list)
		if (!list.length) return []
		// 切換學期到新清單載入完的空窗期, 清單還是舊學期的, 整批收藏都會被誤判成不在清單裡
		if (termIdFromCourseId(list[0].id) !== selected_term_id.value) return []
		const existing_ids = new Set(list.map(course => course.id))
		return [...favorite_ids.value].filter(id => termIdFromCourseId(id) === selected_term_id.value && !existing_ids.has(id))
	})

	const archived_ids = computed(() => archived_courses.value.map(course => course.id))

	// 查得到又沒有 archived 就是還在開課 (課程清單過期才會這樣), 不當成下架也不刪
	function isArchived(id) {
		const course = archived_cache.get(id)
		return !course || Boolean(course.archived)
	}

	function fillArchivedCourses(ids) {
		archived_courses.value = ids.filter(isArchived).map(id => archived_cache.get(id) || { id })
	}

	watch(candidate_ids, async ids => {
		fillArchivedCourses(ids)
		const unknown_ids = ids.filter(id => !archived_cache.has(id))
		if (!unknown_ids.length) return
		const isLatest = startRequest()
		archived_loading.value = true
		try {
			const list = await getCourses(unknown_ids)
			for (const id of unknown_ids) archived_cache.set(id, null)
			for (const course of list) archived_cache.set(course.id, course)
			// 不帶 status 查的是全部課程, 沒回傳就代表這個 id 真的不存在, 這是唯一能刪收藏的情況
			const missing_ids = unknown_ids.filter(id => !archived_cache.get(id))
			// 送出後狀態可能又變了 (連續切學期, 或期間抓到新版課表), 過期的判斷不能拿來刪收藏
			if (missing_ids.length && isLatest()) removeFavorites(missing_ids)
		} catch (error) {
			console.error(error)
			for (const id of unknown_ids) archived_cache.delete(id)
		} finally {
			if (isLatest()) {
				archived_loading.value = false
				fillArchivedCourses(candidate_ids.value)
			}
		}
	}, { immediate: true })

	return { archived_ids, archived_courses, archived_loading }
}

export function useCourseList(options = {}) {
	const { is_heavy = false } = options
	const { selected_term_id } = useSelectedTerm()
	const term_list = shallowRef([])
	const course_list = shallowRef([])
	const loading = ref(false)
	const loaded = ref(false)
	const load_error = ref(false)

	let request_seq = 0

	async function loadCourseList(term_id = selected_term_id.value, options = {}) {
		const { force = false } = options
		const seq = ++request_seq
		load_error.value = false
		if (toValue(is_heavy)) loading.value = true
		try {
			const data = await getCourseList(term_id, { force, onFetch: () => { if (seq === request_seq) loading.value = true } })
			if (seq !== request_seq) return
			term_list.value = data.term_list
			course_list.value = data.course_list
			selected_term_id.value = data.term_id
			reconcileAltFavorites(data.course_list)
		} catch (error) {
			if (seq !== request_seq) return
			console.error(error)
			course_list.value = []
			load_error.value = true
		} finally {
			if (seq === request_seq) {
				loaded.value = true
				await nextTick()
				requestAnimationFrame(() => requestAnimationFrame(() => {
					if (seq === request_seq) loading.value = false
				}))
			}
		}
	}

	async function revalidate() {
		const stale_term_ids = await checkCourseRev()
		if (!stale_term_ids.includes(selected_term_id.value)) return
		loading.value = true
		await loadCourseList(selected_term_id.value, { force: true })
	}

	watch(selected_term_id, (term_id, old_term_id) => {
		if (old_term_id) loadCourseList(term_id)
	})

	watch(useDocumentVisibility(), visibility => {
		if (visibility === 'visible') revalidate()
	})

	onMounted(() => loadCourseList().then(revalidate))

	return { selected_term_id, term_list, course_list, loading, loaded, load_error, loadCourseList }
}
