import { API_BASE_URL } from '@/config'
import { fetchJson } from '@/api/cache'
import { idbGet, idbSet, idbKeys, idbDelete } from '@/lib/db'
import { normalizeTermId, termIdFromCourseId, getStoredTermList, saveTermList } from '@/lib/term'

const course_list_cache = new Map()
const course_list_promise_map = new Map()

export async function getCourseList(term_id = '', options = {}) {
	const { force = false, onFetch } = options
	const id = normalizeTermId(term_id)
	if (force) course_list_cache.delete(id)
	if (!force && id) {
		if (course_list_cache.has(id)) {
			return { term_id: id, term_list: getStoredTermList(), course_list: course_list_cache.get(id) }
		}
		try {
			const cached = await idbGet('course_list', id)
			if (cached) {
				const course_list = Array.isArray(cached) ? cached : cached.course_list
				course_list_cache.set(id, course_list)
				return { term_id: id, term_list: getStoredTermList(), course_list }
			}
		} catch (error) {
			console.error(error)
		}
	}
	if (onFetch) onFetch()
	if (!course_list_promise_map.has(id)) {
		const promise = fetchCourseList(id).finally(() => course_list_promise_map.delete(id))
		course_list_promise_map.set(id, promise)
	}
	return course_list_promise_map.get(id)
}

async function fetchCourseList(id) {
	const data = await fetchJson(`${API_BASE_URL}/course/list/${encodeURIComponent(id)}`, '課程')
	data.term_id = normalizeTermId(data.term_id)
	data.term_list = [...new Set(data.term_list.map(normalizeTermId))]
	course_list_cache.set(data.term_id, data.course_list)
	try {
		await idbSet('course_list', data.term_id, { course_list: data.course_list, rev: data.rev || '' })
	} catch (error) {
		console.error(error)
	}
	saveTermList(data.term_list)
	return data
}

async function postCourseDetail(body, label) {
	const data = await fetchJson(`${API_BASE_URL}/course/detail`, label, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(body)
	})
	return data.course_list || []
}

export async function getCourses(ids) {
	if (!ids.length) return []
	return postCourseDetail({ ids }, '課程')
}

export async function getCachedCourseMap(ids) {
	const map = new Map()
	const id_set = new Set(ids)
	const term_ids = [...new Set(ids.map(termIdFromCourseId))]
	await Promise.all(term_ids.map(async term_id => {
		try {
			const cached = await idbGet('course_list', term_id)
			if (!cached) return
			const course_list = Array.isArray(cached) ? cached : cached.course_list
			for (const course of course_list) {
				if (id_set.has(course.id)) map.set(course.id, course)
			}
		} catch (error) {
			console.error(error)
		}
	}))
	return map
}

export async function getCourseMap(ids) {
	if (!ids.length) return new Map()
	const map = await getCachedCourseMap(ids)
	const unknown_ids = ids.filter(id => !map.has(id))
	if (!unknown_ids.length) return map
	for (const course of await getCourses(unknown_ids)) map.set(course.id, course)
	return map
}

export function getCourseRev() {
	return fetchJson(`${API_BASE_URL}/course/rev`, '課表版本')
}

export async function getCachedTermRevs() {
	const keys = await idbKeys('course_list')
	const entries = await Promise.all(keys.map(async key => {
		const cached = await idbGet('course_list', key)
		return [key, Array.isArray(cached) ? '' : cached?.rev || '']
	}))
	return Object.fromEntries(entries)
}

export async function deleteCachedTerm(term_id) {
	course_list_cache.delete(term_id)
	await idbDelete('course_list', term_id)
}

export function getCourseDetail(id) {
	return fetchJson(`${API_BASE_URL}/course/detail/${encodeURIComponent(id)}`, '課程詳情')
}

export async function getSimilarCourses(id) {
	const data = await fetchJson(`${API_BASE_URL}/course/similar/${encodeURIComponent(id)}`, '相似課程')
	return data.course_list || []
}
