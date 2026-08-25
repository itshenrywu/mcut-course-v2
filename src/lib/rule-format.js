export const DEFAULT_ID = '000'

// 標示非入學系所的課程, 夾在內文中所以要自己對齊基線
export const CROSS_DEPT_BADGE_CLASS = 'relative -top-px border-transparent bg-blue-500 align-middle text-white'

function parseRuleTerm(term) {
	const text = (term || '').trim()
	const half = text.includes('上') ? 1 : text.includes('下') ? 2 : 99
	const grade = ['一', '二', '三', '四'].indexOf(text[0]) + 1
	if (grade) return { grade, half }
	return { grade: half === 99 ? 99 : 0, half }
}

export function sortRuleCourses(course_list, sort_mode) {
	return [...(course_list || [])].sort((a, b) => {
		const x = parseRuleTerm(a.term)
		const y = parseRuleTerm(b.term)
		if (sort_mode === 'term') return x.half - y.half || x.grade - y.grade
		return x.grade - y.grade || x.half - y.half
	})
}

export function splitRuleName(name) {
	const text = (name || '').trim()
	const match = text.match(/^(.*)[（(](.*)[）)]$/)
	if (!match) return { display_name: text, label: '' }
	const label = match[2].trim()
	if (!['應修畢', '開設'].some(keyword => label.includes(keyword))) return { display_name: text, label: '' }
	return { display_name: match[1].trim(), label }
}

export function deptGroups(dept_map, year) {
	return (dept_map[year] || []).filter(item => item.depts.length)
}

export function findDept(dept_map, year, dept_id) {
	for (const group of dept_map[year] || []) {
		const dept = group.depts.find(item => item.id === dept_id)
		if (dept) return dept
	}
	return null
}

function isDayBachelorGroup(dept_map, year, dept_id) {
	const group = (dept_map[year] || []).find(item => item.depts.some(option => option.id === dept_id))
	return group?.group_name === '四技日間部'
}

function isHiddenForDept(rule, dept_name) {
	return Boolean(rule.hide_for) && dept_name.startsWith(rule.hide_for)
}

export function findSelfRule(rule_map, dept_map, year, dept_id) {
	const dept = findDept(dept_map, year, dept_id)
	if (!dept) return null
	const group = (rule_map[year] || []).find(item => item.group_name === '_')
	return group?.rules.find(rule => rule.name === dept.name) || null
}

export function ruleGroups(rule_map, dept_map, year, dept_id) {
	const list = rule_map[year] || []
	const dept_name = findDept(dept_map, year, dept_id)?.name || ''
	const day_bachelor = isDayBachelorGroup(dept_map, year, dept_id)
	return ['第二專長', '跨領域']
		.map(group_name => {
			const group = list.find(item => item.group_name === group_name)
			if (!group || !group.rules.length) return null
			const rules = group.rules.map(rule => ({
				...rule,
				disabled: day_bachelor && isHiddenForDept(rule, dept_name)
			}))
			return { group_name, rules }
		})
		.filter(Boolean)
}

export function findRule(rule_map, dept_map, year, dept_id, rule_id) {
	if (!rule_id) return null
	if (rule_id === DEFAULT_ID) return findSelfRule(rule_map, dept_map, year, dept_id)
	for (const group of rule_map[year] || []) {
		const rule = group.rules.find(item => item.id === rule_id)
		if (rule) return rule
	}
	return null
}

export function ruleDescriptionText(description) {
	const list = description?.rule || []
	if (!list.length) return ''
	const parts = list.map(item => {
		const categorys = (item.categorys || []).filter(Boolean)
		const same_as_name = categorys.length === 1 && categorys[0] === item.name
		const detail = [categorys.length && !same_as_name ? `包含${categorys.join('、')}` : '', item.req].filter(Boolean).join('，')
		return detail ? `${item.name}（${detail}）` : item.name
	})
	const text = parts.join('、')
	const suffix = parts.length > 1 ? '等類別' : ''
	if (['第二專長', '跨領域'].includes(description.type)) return `此${description.type}學分學程有開設${text}${suffix}的課程`
	return `畢業前須完成${text}${suffix}的課程`
}

export function ruleRoutePath(year, dept_id, rule_id) {
	if (!year) return '/rule'
	const parts = [year, dept_id || DEFAULT_ID]
	if (rule_id) parts.push(rule_id)
	return `/rule/${parts.join('/')}`
}
