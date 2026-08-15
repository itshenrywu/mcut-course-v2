import { computed, watch, onMounted, toValue } from 'vue'
import { getRuleList, getRuleDetail } from '@/api/rule'
import { getCourseList } from '@/api/course'
import { isAltCourse } from '@/lib/course-format'
import { createLoader } from '@/lib/loader'
import { DEFAULT_ID } from '@/lib/rule-format'

export * from '@/lib/rule-format'

export function useRuleList() {
	const { data, loading, loaded, load_error, load: loadRuleList } = createLoader(
		async options => {
			const list = await getRuleList(options)
			return { rules: list.rules || {}, depts: list.depts || {} }
		},
		() => ({ rules: {}, depts: {} })
	)

	const rule_map = computed(() => data.value.rules)
	const dept_map = computed(() => data.value.depts)

	onMounted(() => loadRuleList())

	return { rule_map, dept_map, loading, loaded, load_error, loadRuleList }
}

export function useEnrollCourses(term_id) {
	const { data: course_map, loading, load_error, load, reset } = createLoader(
		async id => {
			const { course_list } = await getCourseList(id)
			const map = new Map()
			for (const course of course_list) {
				if (isAltCourse(course)) continue
				const code = course.id.slice(4, 10)
				if (!map.has(code)) map.set(code, [])
				map.get(code).push(course)
			}
			return map
		},
		() => new Map()
	)

	watch(() => toValue(term_id), id => id ? load(id) : reset(), { immediate: true })

	return { course_map, loading, load_error }
}

export function useRuleDetail() {
	const { data: detail, loading, load_error, load, reset } = createLoader(
		(year, dept_id, rule_id, options) => getRuleDetail(year, dept_id, rule_id, options)
	)

	function loadRuleDetail(year, dept_id, rule_id, options = {}) {
		if (!year || !rule_id || (rule_id === DEFAULT_ID && dept_id === DEFAULT_ID)) return reset()
		return load(year, dept_id, rule_id, options)
	}

	return { detail, loading, load_error, loadRuleDetail }
}
