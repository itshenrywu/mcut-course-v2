import { isAltCourse, hasOwnCourseRuleGroup, courseMatchesKeyword, altFor } from '@/lib/course-format'

export const ANY_FILTER = { dept: 'any', grade_class: 'any', enroll_type: 'any', kw: '' }

export function altForKey(dept, grade_class) {
	return `${dept}${grade_class.replace('-', '')}`
}

export function isClassRequiredCourse(course, dept, grade_class) {
	return course.dept === dept && `${course.grade}-${course.class_group}` === grade_class && course.enroll_type === '必修'
}

function normalizeKeyword(kw) {
	return (kw || '').trim().toLowerCase()
}

function generalNameClass(enroll_type) {
	return enroll_type !== 'any' && enroll_type.includes('_') ? enroll_type.split('_') : null
}

function makeMatcher(filter) {
	const { dept, grade_class, enroll_type } = filter
	const kw = normalizeKeyword(filter.kw)
	const grade = grade_class !== 'any' ? grade_class.split('-')[0] : null
	const general_name_class = generalNameClass(enroll_type)
	return course => {
		if (isAltCourse(course)) return false
		if (dept !== 'any' && course.dept !== dept) return false
		if (enroll_type === 'mixed') {
			if (hasOwnCourseRuleGroup(course.dept, course.class_group, course.grade)) return false
			const is_class_required = isClassRequiredCourse(course, dept, grade_class)
			const is_grade_elective = String(course.grade) === grade && course.enroll_type === '選修'
			if (!is_class_required && !is_grade_elective) return false
		} else if (general_name_class) {
			const [name, name_grade_class] = general_name_class
			if (course.name !== name || `${course.grade}${course.class_group}` !== name_grade_class) return false
		} else {
			if (grade_class !== 'any' && `${course.grade}-${course.class_group}` !== grade_class) return false
			if (enroll_type !== 'any' && course.enroll_type !== enroll_type && course.general_type !== enroll_type) return false
		}
		return courseMatchesKeyword(course, kw)
	}
}

export function matchCourses(course_list, filter) {
	return course_list.filter(makeMatcher(filter))
}

export function matchAltCourses(course_list, filter) {
	const { dept, grade_class, enroll_type } = filter
	if (dept === 'any' || grade_class === 'any') return []
	if (enroll_type !== 'any' && enroll_type !== '必修' && enroll_type !== 'mixed') return []
	const key = altForKey(dept, grade_class)
	const kw = normalizeKeyword(filter.kw)
	return course_list.filter(course => {
		if (!isAltCourse(course)) return false
		if (!altFor(course).includes(key)) return false
		if (kw && !course.name.toLowerCase().includes(kw)) return false
		return true
	})
}

export function countMatchedCourses(course_list, filter) {
	const match = makeMatcher(filter)
	let count = 0
	for (const course of course_list) {
		if (match(course)) count++
	}
	return count + matchAltCourses(course_list, filter).length
}

export function filterCount(filter) {
	let count = 0
	if (filter.dept !== 'any') count++
	if (filter.grade_class !== 'any') count++
	if (filter.enroll_type !== 'any') count++
	if (normalizeKeyword(filter.kw)) count++
	return count
}

export function relaxOptions(filter) {
	const { dept, grade_class, enroll_type } = filter
	const kw = normalizeKeyword(filter.kw)
	const options = []
	if (enroll_type !== 'any') {
		options.push({ key: 'enroll_type', label: '不限修別', filter: { ...filter, enroll_type: 'any' } })
	}
	if (grade_class !== 'any') {
		options.push({ key: 'grade_class', label: '不限班級', filter: { ...filter, grade_class: 'any', enroll_type: enroll_type === 'mixed' ? 'any' : enroll_type } })
	}
	if (dept !== 'any') {
		const relaxed_enroll = enroll_type === 'mixed' || generalNameClass(enroll_type) ? 'any' : enroll_type
		options.push({ key: 'dept', label: '不限開課單位', filter: { ...filter, dept: 'any', grade_class: 'any', enroll_type: relaxed_enroll } })
	}
	if (kw && filterCount(filter) > 1) options.push({ key: 'only_kw', label: '只用關鍵字搜尋', filter: { ...ANY_FILTER, kw } })
	const seen = new Set()
	return options.filter(option => {
		const sign = JSON.stringify([option.filter.dept, option.filter.grade_class, option.filter.enroll_type, normalizeKeyword(option.filter.kw)])
		if (seen.has(sign)) return false
		seen.add(sign)
		return true
	})
}
