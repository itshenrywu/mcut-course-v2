import { termFromCourseId, shortTermIdFromCourseId } from './term-format.js'

// 星期六為正常上課日的科系關鍵字 (其餘科系的星期六視為無固定時間)
// 後端也要改 (for og:image)
const SATURDAY_CLASS_DEPT_KEYWORDS = ['進修部', '碩專']

// 各班必修課表要排除的科系關鍵字 (含這些字者不視為可顯示班級必修的科系)
const CLASS_SCHEDULE_EXCLUDE_KEYWORDS = ['學院', '通識', '進修部', '組', 'TAICA']

// 例如外國學生專班 or 分群班級, 課程與同年級其他班不共通
// 這些班不併年級選修顯示, 不提供 mixed
// 值可寫班別 (甲) 代表該系所有年級, 或年級+班別 (1甲) 只指定該年級
const HAS_OWN_COURSE_RULE_GROUP = {
	'四技機械系': ['甲', '乙', '丙', '丁'],
	'四技工設系': ['乙'],
	'四技經管系': ['丙'],
	'四技電機系': ['丙'],
	'四技電子系': ['丙'],
	'四技工管系': ['丙'],
}

// 只固定開在少數星期的科系 (可改用窄欄課表, key 為科系關鍵字, value 為允許的星期)
const NARROW_WEEKDAY_DEPTS = {
	'通識中心': [1, 4],
	'體育組-四技(日)': [1, 3, 4, 5],
	'外文組-四技(日)': [1, 2, 3, 4, 5],
	'TAICA': [1, 2, 3, 4, 5],
}

// 學校的節次編號 (0.5 為早自習, 4.5 為午休, 8.5 為晚餐)
export const SECTION_ORDER = [0.5, 1, 2, 3, 4, 4.5, 5, 6, 7, 8, 8.5, 9, 10, 11, 12]

// 課表預設顯示的節次範圍, 有課排在範圍外時才往外延伸
const DEFAULT_MIN_SECTION = 1
const DEFAULT_MAX_SECTION = 8

// 位於預設範圍內但預設不顯示的節次 (午休與晚餐), 有課用到才會顯示
const OPTIONAL_SECTIONS = [4.5, 8.5]

// 各節次的上下課時間
export const SECTION_TIME = {
	0.5: ['07:00', '07:50'],
	1: ['08:00', '08:50'],
	2: ['09:00', '09:50'],
	3: ['10:00', '10:50'],
	4: ['11:00', '11:50'],
	4.5: ['12:00', '12:50'],
	5: ['13:00', '13:50'],
	6: ['14:00', '14:50'],
	7: ['15:00', '15:50'],
	8: ['16:00', '16:50'],
	8.5: ['17:00', '17:50'],
	9: ['18:40', '19:25'],
	10: ['19:30', '20:15'],
	11: ['20:25', '21:10'],
	12: ['21:15', '22:00']
}

// 課表同一時段最多能並排的欄數 (超過就摺成 overflow, 也是能否使用課表檢視的門檻)
export const MAX_TABLE_COLS = 5

export const WEEKDAY_LABELS = [null, '一', '二', '三', '四', '五']

// index 對應 Date#getDay
export const FULL_WEEKDAY_LABELS = ['日', '一', '二', '三', '四', '五', '六']

// index 為年級 - 1
export const GRADE_LABELS = ['一', '二', '三', '四']

export const ENROLL_TYPE_CLASSES = {
	必修: 'bg-orange-400/10 text-orange-600 dark:text-orange-400 inset-ring inset-ring-orange-400/10 dark:inset-ring-orange-400/25',
	選修: 'bg-emerald-400/10 text-emerald-600 dark:text-emerald-400 inset-ring inset-ring-emerald-400/10 dark:inset-ring-emerald-400/25',
	DEFAULT: 'bg-color-5/10 text-color-7 inset-ring inset-ring-color-5/10'
}

export const ENROLL_TYPE_TABLE_CLASSES = {
	必修: 'border-orange-400/40 bg-orange-400/25 text-color-9/85 hover:bg-orange-400/35',
	選修: 'border-emerald-400/40 bg-emerald-400/25 text-color-9/85 hover:bg-emerald-400/35',
	DEFAULT: 'border-color-3 bg-color-3 text-color-9 hover:bg-color-4'
}

export function formatDeptClass(course) {
	return [course.dept, course.grade, course.class_group].filter(v => v != null && v !== '').join(' ')
}

function formatSection(section) {
	return section.length > 1 ? `${section[0]}~${section[section.length - 1]}` : `${section[0]}`
}

function formatWeekday(day, course) {
	if (WEEKDAY_LABELS[day]) return WEEKDAY_LABELS[day]
	const saturday_class_dept = SATURDAY_CLASS_DEPT_KEYWORDS.some(keyword => (course?.dept || '').includes(keyword))
	if (day === 6 && saturday_class_dept) return '六'
	return ''
}

export function formatCourseTime(time, course) {
	const week = formatWeekday(time.day, course) || '其他'
	return `(${week}) ${formatSection(time.section)}`
}

export function formatCourseTimes(course) {
	return (course?.time || []).map(time => formatCourseTime(time, course)).join('、')
}

export function sectionSpan(start, end) {
	const from = SECTION_ORDER.indexOf(start)
	const to = SECTION_ORDER.indexOf(end)
	if (from < 0 || to < 0 || from > to) return []
	return SECTION_ORDER.slice(from, to + 1)
}

export function visibleSections(section_groups) {
	let min = DEFAULT_MIN_SECTION
	let max = DEFAULT_MAX_SECTION
	const used = new Set()
	for (const sections of section_groups) {
		for (const section of sections || []) {
			if (!SECTION_ORDER.includes(section)) continue
			min = Math.min(min, section)
			max = Math.max(max, section)
			used.add(section)
		}
	}
	return SECTION_ORDER.filter(section => {
		if (section < min || section > max) return false
		return !OPTIONAL_SECTIONS.includes(section) || used.has(section)
	})
}

export function formatSectionRange(section) {
	const start = SECTION_TIME[section[0]]
	const end = SECTION_TIME[section[section.length - 1]]
	if (!start || !end) return '未定'
	return `${start[0]} ~ ${end[1]}`
}

export function formatSectionStart(section) {
	const time = SECTION_TIME[section]
	if (!time) return '未定'
	return time[0]
}

export function isNoFixedTime(course) {
	const time_list = course?.time || []
	if (!time_list.length) return false

	const half_section_only = time_list.every(time => time.section?.length && time.section.every(section => [0.5, 4.5, 8.5].includes(section)))
	if (half_section_only) return true

	const unknown_weekday_only = time_list.every(time => !formatWeekday(time.day, course))
	if (!unknown_weekday_only) return false

	const general_flex_class = (course.dept || '').includes('通識中心') && Number(course.grade) === 1 && course.class_group === '丙'
	const internship_term = termFromCourseId(course.id) === '2' && Number(course.grade) === 3
	return general_flex_class || internship_term
}

export function hasRemark(course) {
	return !!(course?.remark || '').trim()
}

export function isBlockCourse(course) {
	const time_list = course?.time || []
	if (!time_list.length) return false
	if (!time_list.every(time => time.day === 6)) return false
	return (course.remark || '').includes('塊狀')
}

function timesConflict(time_a, time_b) {
	if (!time_a.day || time_a.day !== time_b.day) return false
	return time_a.section.some(section => time_b.section.includes(section))
}

function coursesConflict(course_a, course_b) {
	if (shortTermIdFromCourseId(course_a.id) !== shortTermIdFromCourseId(course_b.id)) return false
	return course_a.time.some(ta => course_b.time.some(tb => timesConflict(ta, tb)))
}

export function conflictingCourses(course, courses) {
	if (!course?.time?.length) return []
	return courses.filter(other => other.id !== course.id && coursesConflict(other, course))
}

export function formatLimit(min, max) {
	if (min == 0 && max == 0) return '無人數限制'
	if (min == 0) return `最多 ${max} 人`
	if (max == 0) return `至少 ${min} 人`
	return `${min} ~ ${max} 人`
}

export function isAltCourse(course) {
	return course.id.includes('ALT')
}

const keyword_index_cache = new WeakMap()

export function courseKeywordIndex(course) {
	let index = keyword_index_cache.get(course)
	if (!index) {
		index = { name: course.name.toLowerCase(), teacher: course.teacher.toLowerCase(), id: course.id.toLowerCase() }
		keyword_index_cache.set(course, index)
	}
	return index
}

export function courseMatchesKeyword(course, kw, options = {}) {
	const { teacher = true } = options
	if (!kw) return true
	const index = courseKeywordIndex(course)
	if (index.name.includes(kw)) return true
	if (teacher && index.teacher.includes(kw)) return true
	return kw.length >= 4 && index.id.includes(kw)
}

export function altFor(course) {
	return Array.isArray(course?.alt_for) ? course.alt_for : []
}

export function altCourseIds(course) {
	return Array.isArray(course?.courses) ? course.courses : []
}

export function isMultiAltCourse(course) {
	return isAltCourse(course) && altCourseIds(course).length > 1
}

export function courseDisplayName(course) {
	return course.name || (isAltCourse(course) ? '' : course.id)
}

export function formatCourseMeta(course) {
	const parts = []
	const dept_class = formatDeptClass(course)
	if (dept_class) parts.push(dept_class)
	if (course.teacher && course.teacher !== '視分班而定') parts.push(`${course.teacher} 老師`)
	const enroll_credit = [course.enroll_type, course.credit ? `${course.credit} 學分` : ''].filter(Boolean).join(' ')
	if (enroll_credit) parts.push(enroll_credit)
	if (!isAltCourse(course)) parts.push(course.id)
	return parts.join('・')
}

export function favoriteCourseId(course) {
	if (!isAltCourse(course)) return course.id
	const ids = altCourseIds(course)
	return ids.length === 1 ? ids[0] : course.id
}

export function courseOrAltRoutePath(course) {
	return courseRoutePath(isAltCourse(course) ? altCourseIds(course)[0] : course.id)
}

export function isClassScheduleDept(dept) {
	if (!dept) return false
	return !CLASS_SCHEDULE_EXCLUDE_KEYWORDS.some(keyword => dept.includes(keyword))
}

export function hasOwnCourseRuleGroup(dept, class_group, grade) {
	const class_groups = HAS_OWN_COURSE_RULE_GROUP[dept]
	if (!class_groups) return false
	if (class_groups.includes(class_group)) return true
	if (grade == null || grade === '') return false
	return class_groups.includes(`${grade}${class_group}`)
}

export function collectGradeInfo(grade_map, key, course) {
	let grade_info = grade_map.get(key)
	if (!grade_info) {
		grade_info = { grade: course.grade, class_groups: new Set(), has_elective: false }
		grade_map.set(key, grade_info)
	}
	grade_info.class_groups.add(course.class_group)
	if (course.enroll_type === '選修') grade_info.has_elective = true
	return grade_info
}

export function canShowMixedGrade(dept, class_group, grade_info) {
	if (!dept || !grade_info) return false
	if (!isClassScheduleDept(dept)) return false
	if (hasOwnCourseRuleGroup(dept, class_group, grade_info.grade)) return false

	let count = 0
	for (const cg of grade_info.class_groups) {
		if (!hasOwnCourseRuleGroup(dept, cg, grade_info.grade)) count++
	}
	if (count < 2) return false

	return grade_info.has_elective
}

export function formatMixed(grade_class) {
	const grade = grade_class && grade_class !== 'any' ? grade_class.split('-')[0] : ''
	return `必修 + ${grade} 年級選修`
}

export function hasMultiClassElective(courses, dept, grade_class) {
	if (!dept || dept === 'any' || !grade_class || grade_class === 'any') return false
	const grade = grade_class.split('-')[0]
	const class_groups = new Set()
	for (const course of courses) {
		if (isAltCourse(course)) continue
		if (course.dept !== dept) continue
		if (String(course.grade) !== grade) continue
		if (course.enroll_type !== '選修') continue
		if (hasOwnCourseRuleGroup(dept, course.class_group, course.grade)) continue
		class_groups.add(course.class_group)
		if (class_groups.size > 1) return true
	}
	return false
}

export function otherClassGroupLabel(course, grade_class) {
	if (!grade_class || grade_class === 'any') return ''
	if (isAltCourse(course)) return ''
	const [grade, class_group] = grade_class.split('-')
	if (String(course.grade) === grade && course.class_group === class_group) return ''
	return [course.grade, course.class_group].filter(v => v != null && v !== '').join(' ')
}

export function narrowWeekdayDept(courses) {
	if (!courses.length) return null
	const matched = Object.entries(NARROW_WEEKDAY_DEPTS).find(([keyword]) =>
		courses.every(course => (course.dept || '').includes(keyword))
	)
	return matched ? matched[1] : null
}

export function narrowWeekdays(courses, allow_days = narrowWeekdayDept(courses)) {
	if (!allow_days) return null
	const days = new Set()
	for (const course of courses) {
		for (const time of course.time) {
			if (time.day >= 1 && time.day <= 5) days.add(time.day)
		}
	}
	if (!days.size) return null
	return [...days].every(day => allow_days.includes(day)) ? allow_days : null
}

export function maxTableStack(courses) {
	const cells = new Map()
	let max = 0
	for (const course of courses) {
		for (const time of course.time || []) {
			if (time.day < 1 || time.day > 5) continue
			for (const section of time.section || []) {
				const key = `${time.day}-${section}`
				const count = (cells.get(key) || 0) + 1
				cells.set(key, count)
				if (count > max) max = count
			}
		}
	}
	return max
}

export function courseRoutePath(id) {
	return `/course/${shortTermIdFromCourseId(id)}/${id.slice(4)}`
}

export function courseSummaryParts(course) {
	return {
		dept_class: formatDeptClass(course),
		teacher: course.teacher ? `${course.teacher} 老師` : '',
		credit: course.credit != null ? `${course.credit} 學分` : '',
		general_type: course.general_type ? `通識 - ${course.general_type}` : '',
		remark: (course.remark || '').trim()
	}
}

export function courseIdFromRoute(short_term_id, course_no) {
	return `${short_term_id}${course_no}`
}
