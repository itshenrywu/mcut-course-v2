import { getCourseRev, getCachedTermRevs, deleteCachedTerm } from '@/api/course'
import { useSelectedTerm, saveTermList } from '@/lib/term'

const REV_CHECK_TTL = 30 * 60 * 1000

let checking = null

async function fetchStaleTermIds() {
	const { selected_term_id } = useSelectedTerm()
	const data = await getCourseRev()
	const server_rev = data.rev || {}
	const cached_rev = await getCachedTermRevs()
	const stale_term_ids = Object.keys(cached_rev).filter(term_id => {
		const rev = server_rev[term_id]
		return rev && rev !== cached_rev[term_id]
	})
	localStorage.setItem('mcv2-rev-checked-at', String(Date.now()))
	if (data.term_list) saveTermList(data.term_list)
	for (const term_id of stale_term_ids) {
		if (term_id !== selected_term_id.value) await deleteCachedTerm(term_id)
	}
	return stale_term_ids
}

export async function checkCourseRev(options = {}) {
	const { force = false } = options
	const checked_at = Number(localStorage.getItem('mcv2-rev-checked-at') || 0)
	if (!force && Date.now() - checked_at < REV_CHECK_TTL) return []
	if (checking) return checking
	checking = fetchStaleTermIds()
		.catch(error => {
			console.error(error)
			return []
		})
		.finally(() => { checking = null })
	return checking
}
