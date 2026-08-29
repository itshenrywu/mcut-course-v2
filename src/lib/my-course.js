import { ref, watch } from 'vue'
import { readJsonItem, writeJsonItem } from '@/lib/storage'
import { SECTION_ORDER } from '@/lib/course-format'

export const MY_WEEKDAYS = [1, 2, 3, 4, 5]

export const NAME_MAX_LENGTH = 30
export const REMARK_MAX_LENGTH = 50

// 課表顯示設定的項目 (皆為顯示 / 隱藏, 預設全開), 依序排列於下拉選單
// parent 表示需要上層項目開啟才可設定
// group 表示同組全開時, 摘要文字合併成組名顯示
export const MY_STYLE_FIELDS = [
	{ key: 'weekday', label: '星期' },
	{ key: 'section', label: '節次' },
	{ key: 'h_line', label: '水平隔線', group: '隔線' },
	{ key: 'v_line', label: '垂直隔線', group: '隔線' },
	{ key: 'time_start', label: '開始時間', group: '時間' },
	{ key: 'time_end', label: '結束時間', parent: 'time_start', group: '時間' },
	{ key: 'remark', label: '備註' }
]

// 課表在圖片中的外距 (佔圖片寬度的百分比)
export const MARGIN_MIN = 0
export const MARGIN_MAX = 15
const DEFAULT_MARGIN = 5

// 課程方塊的圓角 (虛擬座標, 畫的時候一律乘上 table_scale)
export const RADIUS_MIN = 0
export const RADIUS_MAX = 30
const DEFAULT_RADIUS = 20

// 課程方塊填色的透明度 (百分比, 越大越透出底色), 方塊內文字一律不透明
export const TRANSPARENCY_MIN = 0
export const TRANSPARENCY_MAX = 90
const DEFAULT_TRANSPARENCY = 20
export const TRANSPARENCY_DISABLED = 10  // 低於此值時, 霧化設定會被鎖住

// 課程方塊底下的霧化半徑 (虛擬座標, 畫的時候一律乘上 table_scale), 要有透明度才看得出來
export const BLUR_MIN = 0
export const BLUR_MAX = 30
const DEFAULT_BLUR = 0

// 課表底色的常用選項, 其餘顏色由色盤自訂
// 畫布只吃色碼, 這裡直接寫死 mist-50 / mist-900 的 hex
export const MY_BG_COLORS = [
	{ value: '#f9fbfb', label: '淺色' },
	{ value: '#161b1d', label: '深色' },
]

// 課程方塊的主題配色, colors 依課名首次出現順序輪替 (同課名同色)
// title (課名) 與 text (時間 / 備註) 為單一色, 或對應 colors 每一色的字色陣列
// value 為存進設定的主題 id, 沿用舊版的編號 (排列順序與編號無關), 舊版資料才不用對照表
// 已存在的編號不可變動, 新主題從 15 往後遞增
export const MY_THEMES = [
	{
		value: 3,
		colors: ['#dddddd'],
		title: '#22292b',
		text: '#394447'
	},
	{
		value: 4,
		colors: ['#444444'],
		title: '#f9fbfb',
		text: '#f1f3f3'
	},
	{
		value: 1,
		colors: ['#f8bbd0', '#ffcdd2', '#ffe0b2', '#fff9c4', '#f0f4c3', '#c8e6c9', '#b2ebf2', '#bbdefb', '#c5cae9', '#d1c4e9', '#d7ccc8', '#dddddd'],
		title: '#22292b',
		text: '#394447'
	},
	{
		value: 5,
		colors: ['#f1c0e8', '#ffcfd2', '#fde4cf', '#fbf8cc', '#b9fbc0', '#98f5e1', '#8eecf5', '#90dbf4', '#a3c4f3', '#cfbaf0'],
		title: '#22292b',
		text: '#394447'
	},
	{
		value: 8,
		colors: ['#fec5bb', '#fcd5ce', '#fae1dd', '#f8edeb', '#e8e8e4', '#d8e2dc', '#ece4db', '#ffe5d9', '#ffd7ba', '#fec89a'],
		title: '#22292b',
		text: '#394447'
	},
	{
		value: 10,
		colors: ['#eae4e9', '#fff1e6', '#fde2e4', '#fad2e1', '#e2ece9', '#bee1e6', '#f0efeb', '#dfe7fd', '#cddafd'],
		title: '#22292b',
		text: '#394447'
	},
	{
		value: 15,
		colors: ['#fce7f3', '#ffe4e6', '#ffedd4', '#fef9c2', '#ecfcca', '#dcfce7', '#cbfbf1', '#cefafe', '#dff2fe', '#dbeafe', '#e0e7ff'],
		title: '#22292b',
		text: '#394447'
	},
	{
		value: 13,
		colors: ['#f94144', '#f3722c', '#f8961e', '#f9844a', '#f9c74f', '#90be6d', '#43aa8b', '#4d908e', '#577590', '#277da1'],
		title: '#f9fbfb',
		text: '#f1f3f3'
	},
	{
		value: 2,
		colors: ['#c0392b', '#e74c3c', '#e67e22', '#f9a825', '#2ecc71', '#27ae60', '#1abc9c', '#3498db', '#2980b9', '#8e44ad', '#6d4c41', '#444444'],
		title: '#f9fbfb',
		text: '#f1f3f3'
	},
	{
		value: 6,
		colors: ['#e3f2fd', '#bbdefb', '#90caf9', '#64b5f6', '#42a5f5', '#2196f3', '#1e88e5', '#1976d2', '#1565c0', '#0d47a1'],
		title: ['#22292b', '#22292b', '#22292b', '#22292b', '#22292b', '#f9fbfb', '#f9fbfb', '#f9fbfb', '#f9fbfb', '#f9fbfb'],
		text: ['#394447', '#394447', '#394447', '#394447', '#394447', '#f1f3f3', '#f1f3f3', '#f1f3f3', '#f1f3f3', '#f1f3f3']
	},
	{
		value: 7,
		colors: ['#d8f3dc', '#b7e4c7', '#95d5b2', '#74c69d', '#52b788', '#40916c', '#2d6a4f', '#1b4332'],
		title: ['#22292b', '#22292b', '#22292b', '#22292b', '#f9fbfb', '#f9fbfb', '#f9fbfb', '#f9fbfb'],
		text: ['#394447', '#394447', '#394447', '#394447', '#f1f3f3', '#f1f3f3', '#f1f3f3', '#f1f3f3']
	},
	{
		value: 9,
		colors: ['#d9ed92', '#b5e48c', '#99d98c', '#76c893', '#52b69a', '#34a0a4', '#168aad', '#1a759f', '#1e6091', '#184e77'],
		title: ['#22292b', '#22292b', '#22292b', '#22292b', '#22292b', '#22292b', '#f9fbfb', '#f9fbfb', '#f9fbfb', '#f9fbfb'],
		text: ['#394447', '#394447', '#394447', '#394447', '#394447', '#394447', '#f1f3f3', '#f1f3f3', '#f1f3f3', '#f1f3f3']
	},
	{
		value: 11,
		colors: ['#f72585', '#b5179e', '#7209b7', '#560bad', '#480ca8', '#3a0ca3', '#3f37c9', '#4361ee', '#4895ef', '#4cc9f0'],
		title: ['#f9fbfb', '#f9fbfb', '#f9fbfb', '#f9fbfb', '#f9fbfb', '#f9fbfb', '#f9fbfb', '#f9fbfb', '#22292b', '#22292b'],
		text: ['#f1f3f3', '#f1f3f3', '#f1f3f3', '#f1f3f3', '#f1f3f3', '#f1f3f3', '#f1f3f3', '#f1f3f3', '#394447', '#394447']
	},
	{
		value: 14,
		colors: ['#ff7b00', '#ff8800', '#ff9500', '#ffa200', '#ffb700', '#ffc300', '#ffd000', '#ffdd00', '#ffea00'],
		title: '#22292b',
		text: '#394447'
	},
	{
		value: 12,
		colors: ['#582f0e', '#7f4f24', '#936639', '#a68a64', '#b6ad90', '#c2c5aa', '#a4ac86', '#656d4a', '#414833', '#333d29'],
		title: ['#f9fbfb', '#f9fbfb', '#22292b', '#22292b', '#22292b', '#22292b', '#22292b', '#f9fbfb', '#f9fbfb', '#f9fbfb'],
		text: ['#f1f3f3', '#f1f3f3', '#394447', '#394447', '#394447', '#394447', '#394447', '#f1f3f3', '#f1f3f3', '#f1f3f3']
	},
]

const DEFAULT_THEME = 1

// 背景用純色或使用者自選的圖片, 圖片本身存在 IndexedDB (見 my-course-image.js)
export const BG_TYPES = ['color', 'image']

// 背景圖片上的遮罩深淺, 換圖時依圖片明暗自動選一個 (見 my-course-canvas.js 的 autoScrim)
export const BG_SCRIMS = [
	{ value: 'none', label: '無' },
	{ value: 'light', label: '淺色' },
	{ value: 'dark', label: '深色' }
]

const DEFAULT_BG_SCRIM = 'none'

const DEFAULT_STYLE = {
	...Object.fromEntries(MY_STYLE_FIELDS.map(field => [field.key, true])),
	margin: DEFAULT_MARGIN,
	radius: DEFAULT_RADIUS,
	transparency: DEFAULT_TRANSPARENCY,
	blur: DEFAULT_BLUR,
	bg_type: BG_TYPES[0],
	bg_color: MY_BG_COLORS[0].value,
	bg_custom_color: '',
	bg_scrim: DEFAULT_BG_SCRIM,
	theme: DEFAULT_THEME
}

// 同步到帳號的樣式欄位, 背景圖本身走 my-course-image 的二進位端點
const SYNC_STYLE_KEYS = Object.keys(DEFAULT_STYLE)

export function isHexColor(value) {
	return typeof value === 'string' && /^#[0-9a-f]{6}$/i.test(value)
}

export function findTheme(value) {
	return MY_THEMES.find(theme => theme.value === value) || MY_THEMES.find(theme => theme.value === DEFAULT_THEME)
}

export function themeColor(color, index) {
	return Array.isArray(color) ? color[index % color.length] : color
}

function isValidMyBlock(course) {
	if (!course || typeof course !== 'object') return false
	if (typeof course.name !== 'string' || !course.name) return false
	if (!MY_WEEKDAYS.includes(course.day)) return false
	if (!SECTION_ORDER.includes(course.start) || !SECTION_ORDER.includes(course.end)) return false
	return course.start <= course.end
}

export function isValidMyCourse(course) {
	if (typeof course?.id !== 'string' || !course.id) return false
	return isValidMyBlock(course)
}

export function findConflict(courses, course, exclude_id = '') {
	return courses.find(item => item.id !== exclude_id
		&& item.day === course.day
		&& item.start <= course.end
		&& course.start <= item.end) || null
}

function sectionRanges(sections) {
	const ranges = []
	for (const section of SECTION_ORDER) {
		if (!sections.includes(section)) continue
		const last = ranges[ranges.length - 1]
		if (last && SECTION_ORDER.indexOf(last[1]) === SECTION_ORDER.indexOf(section) - 1) last[1] = section
		else ranges.push([section, section])
	}
	return ranges
}

export function courseToMyCourses(course, remark = course.teacher) {
	const list = []
	for (const time of course.time || []) {
		if (!MY_WEEKDAYS.includes(time.day)) continue
		for (const [start, end] of sectionRanges(time.section || [])) {
			list.push({
				name: (course.name || '').trim().slice(0, NAME_MAX_LENGTH),
				day: time.day,
				start,
				end,
				remark: (remark || '').trim().slice(0, REMARK_MAX_LENGTH)
			})
		}
	}
	return list
}

function dropConflicts(courses) {
	const kept = []
	for (const course of courses) {
		if (findConflict(kept, course)) continue
		kept.push(course)
	}
	return kept
}

const my_courses = ref(dropConflicts(readJsonItem('mcv2-my-courses', [], Array.isArray).filter(isValidMyCourse)))

function normalizeStyle(value) {
	const style = { ...DEFAULT_STYLE }
	for (const field of MY_STYLE_FIELDS) {
		if (typeof value[field.key] === 'boolean') style[field.key] = value[field.key]
	}
	if (Number.isFinite(value.margin)) style.margin = Math.min(MARGIN_MAX, Math.max(MARGIN_MIN, Math.round(value.margin)))
	if (Number.isFinite(value.radius)) style.radius = Math.min(RADIUS_MAX, Math.max(RADIUS_MIN, Math.round(value.radius)))
	if (Number.isFinite(value.transparency)) style.transparency = Math.min(TRANSPARENCY_MAX, Math.max(TRANSPARENCY_MIN, Math.round(value.transparency)))
	if (Number.isFinite(value.blur)) style.blur = Math.min(BLUR_MAX, Math.max(BLUR_MIN, Math.round(value.blur)))
	if (BG_TYPES.includes(value.bg_type)) style.bg_type = value.bg_type
	if (isHexColor(value.bg_color)) style.bg_color = value.bg_color.toLowerCase()
	if (isHexColor(value.bg_custom_color)) style.bg_custom_color = value.bg_custom_color.toLowerCase()
	if (BG_SCRIMS.some(scrim => scrim.value === value.bg_scrim)) style.bg_scrim = value.bg_scrim
	if (MY_THEMES.some(theme => theme.value === value.theme)) style.theme = value.theme
	return style
}

const my_style = ref(normalizeStyle(readJsonItem('mcv2-my-style', {}, value => Boolean(value) && typeof value === 'object' && !Array.isArray(value))))

watch(my_style, value => writeJsonItem('mcv2-my-style', value), { deep: true })

function save() {
	writeJsonItem('mcv2-my-courses', my_courses.value)
}

function createId() {
	return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

export function nextSection(section) {
	const index = SECTION_ORDER.indexOf(section)
	if (index < 0) return section
	return SECTION_ORDER[Math.min(index + 1, SECTION_ORDER.length - 1)]
}

function toDocumentCourse(course) {
	return {
		name: course.name,
		day: course.day,
		start: course.start,
		end: course.end,
		remark: typeof course.remark === 'string' ? course.remark : ''
	}
}

function toDocumentStyle(style) {
	return Object.fromEntries(SYNC_STYLE_KEYS.map(key => [key, style[key]]))
}

export function myCourseDocument() {
	return {
		courses: my_courses.value.map(toDocumentCourse),
		style: toDocumentStyle(my_style.value)
	}
}

export function normalizeMyCourseDocument(document) {
	const courses = Array.isArray(document?.courses) ? document.courses : []
	const style = document?.style && typeof document.style === 'object' && !Array.isArray(document.style) ? document.style : {}
	return {
		courses: dropConflicts(courses.filter(isValidMyBlock)).map(toDocumentCourse),
		style: toDocumentStyle(normalizeStyle(style))
	}
}

export function applyMyCourseDocument(document) {
	const next = normalizeMyCourseDocument(document)
	my_courses.value = next.courses.map(course => ({ ...course, id: createId() }))
	my_style.value = normalizeStyle(next.style)
	save()
}

export function resetMyCourse() {
	my_courses.value = []
	my_style.value = normalizeStyle({})
	save()
}

export function useMyCourse() {
	function addMyCourse(data) {
		const course = { ...data, id: createId() }
		my_courses.value = [...my_courses.value, course]
		save()
		return course
	}

	function addMyCourses(list) {
		const courses = list.map(data => ({ ...data, id: createId() }))
		my_courses.value = [...my_courses.value, ...courses]
		save()
		return courses
	}

	function updateMyCourse(id, data) {
		my_courses.value = my_courses.value.map(course => course.id === id ? { ...course, ...data, id } : course)
		save()
	}

	function removeMyCourse(id) {
		my_courses.value = my_courses.value.filter(course => course.id !== id)
		save()
	}

	function clearMyCourses() {
		my_courses.value = []
		save()
	}

	return { my_courses, addMyCourse, addMyCourses, updateMyCourse, removeMyCourse, clearMyCourses }
}

export function useMyStyle() {
	return { my_style }
}
