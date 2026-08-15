import { API_BASE_URL } from '@/config'
import { cachedFetch } from '@/api/cache'

export function getRuleList(options = {}) {
	return cachedFetch('rule/list', `${API_BASE_URL}/rule/list`, { ...options, label: '畢業學分門檻' })
}

export function getRuleDetail(year, dept_id, rule_id, options = {}) {
	const key = `${year}/${dept_id}/${rule_id}`
	const path = [year, dept_id, rule_id].map(encodeURIComponent).join('/')
	return cachedFetch(`rule/detail/${key}`, `${API_BASE_URL}/rule/detail/${path}/`, { ...options, label: '課程總表' })
}
