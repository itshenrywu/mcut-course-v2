import { ref, computed, watch } from 'vue'
import { getCalendar } from '@/api/info'
import { createLoader } from '@/lib/loader'
import { FULL_WEEKDAY_LABELS } from '@/lib/course-format'
import { spaceText } from '@/lib/utils'

// 分類的顯示順序, key 為 API 的分類 key, 沒列到的排在最後
const CALENDAR_ORDER = ['school', 'club', 'pe']
// 各分類的適用對象, 外層 key 為分類 key, 內層 key 為事件 group 陣列裡的值, 有列出的分類只給選對象, 分類本身不會出現在選項裡, 後端新增對象時要在這裡補一組
const CALENDAR_GROUPS = {
	school: [
		{ key: 'g1', name: '大一' },
		{ key: 'g2', name: '大二' },
		{ key: 'g3', name: '大三' },
		{ key: 'g4', name: '大四' },
		{ key: 'm', name: '碩/博' }
	]
}
// 各分類的說明, key 為分類 key, 只顯示在篩選選項裡, 沒列到的就不顯示
const CALENDAR_NOTES = {
	club: '課外組社團活動行事曆',
	pe: '體育室器材借用行事曆'
}
// 依活動名稱關鍵字決定色調, 由上往下比對, 第一個命中的就用
const EVENT_TONE_RULES = [
	{ tone: 'red', keywords: ['放假', '連假', '補假'] },
	{ tone: 'blue', keywords: ['選課', '加退選', '初選'] },
	{ tone: 'orange', keywords: ['期中考', '期末考'] }
]

// 日期一律用 YYYY-MM-DD 字串搭配 UTC 運算, 避免時區與日光節約造成日期偏移
const DAY_MS = 86400000
// 分類選項的值, 有適用對象的分類是 `分類key:對象key`, 其餘就只有分類 key
const GROUP_SEPARATOR = ':'
export const DEFAULT_CATEGORY = 'school:g1'
// 月曆每週至少保留的事件列數, 不足的補空列, 各週高度才會一致
const MIN_LANES = 2
// fetchMonth 已經連前後各一個月一起抓, 只要再暖外側的月份, 切到隔壁月就不必等網路
const PRELOAD_OFFSET = 2
export const EVENT_GRID_CLASSES = {
	red: 'border-red-400/40 bg-red-400/20 text-red-700 dark:text-red-300',
	blue: 'border-blue-400/40 bg-blue-400/20 text-blue-700 dark:text-blue-300',
	orange: 'border-orange-400/40 bg-orange-400/20 text-orange-700 dark:text-orange-300',
	DEFAULT: 'border-color-5/40 bg-color-5/25 text-color-9/85'
}
export const EVENT_DOT_CLASSES = {
	red: 'bg-red-500',
	blue: 'bg-blue-500',
	orange: 'bg-orange-500',
	DEFAULT: 'bg-color-5'
}
export const EVENT_TEXT_CLASSES = {
	red: 'text-red-600 dark:text-red-400',
	blue: 'text-blue-600 dark:text-blue-400',
	orange: 'text-orange-600 dark:text-orange-400',
	DEFAULT: ''
}

function pad(value) {
	return String(value).padStart(2, '0')
}

function keyToDate(key) {
	return new Date(`${key}T00:00:00Z`)
}

function dateToKey(date) {
	return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`
}

export function addDays(key, days) {
	return dateToKey(new Date(keyToDate(key).getTime() + days * DAY_MS))
}

export function dayDiff(from_key, to_key) {
	return Math.round((keyToDate(to_key).getTime() - keyToDate(from_key).getTime()) / DAY_MS)
}

export function weekdayOf(key) {
	return keyToDate(key).getUTCDay()
}

export function todayKey() {
	const now = new Date()
	return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
}

export function formatMonthLabel(year, month) {
	return `${year}/${month}`
}

export function formatDayLabel(key) {
	return `${Number(key.slice(5, 7))}/${Number(key.slice(8, 10))} (${FULL_WEEKDAY_LABELS[weekdayOf(key)]})`
}

export function formatDateRange(event) {
	const from = `${Number(event.start_key.slice(5, 7))}/${Number(event.start_key.slice(8, 10))}`
	const to = `${Number(event.end_key.slice(5, 7))}/${Number(event.end_key.slice(8, 10))}`
	return event.start_key === event.end_key ? from : `${from} ~ ${to}`
}

export function formatEventTime(event, day_key = '') {
	if (event.all_day) return ''
	if (event.start_key === event.end_key || !day_key) return [event.start_time, event.end_time].filter(Boolean).join(' ~ ')
	if (day_key === event.start_key) return `${event.start_time} 開始`
	if (day_key === event.end_key) return `${event.end_time} 結束`
	return ''
}

// 備註可能是純文字換行 (Google 行事曆) 或 HTML (學校行事曆), 一律當 HTML 渲染, <br> 後面的換行要吃掉才不會多空一行
function parseDescription(text) {
	return String(text || '').replace(/<br\s*\/?>\s*/gi, '<br>').trim()
}

// 比對 CALENDAR_GROUPS 而不是直接看 groups 長度, 未知的對象值才不會被算進去
function groupText(calendar, groups) {
	const list = CALENDAR_GROUPS[calendar]
	if (!list) return ''
	const matched = list.filter(item => groups.includes(item.key))
	if (!matched.length || matched.length === list.length) return '全校'
	return matched.map(item => item.name).join('、')
}

function eventTone(summary) {
	const rule = EVENT_TONE_RULES.find(item => item.keywords.some(keyword => summary.includes(keyword)))
	return rule ? rule.tone : 'DEFAULT'
}

// 全天活動的 end 是 ICS 的 DTEND, 指向結束日的隔天, 要退一天才是實際最後一天
// 沒有標題的活動直接捨棄, 回傳 null 由 parseEvents 濾掉
function parseEvent(event, index) {
	const summary = spaceText(event.summary)
	if (!summary) return null
	const all_day = Boolean(event.all_day)
	const start = String(event.start || '')
	const end = String(event.end || '')
	const start_key = start.slice(0, 10)
	const raw_end_key = end.slice(0, 10) || start_key
	const end_key = all_day && raw_end_key > start_key ? addDays(raw_end_key, -1) : raw_end_key
	const groups = Array.isArray(event.group) ? event.group : []
	return {
		id: `${event.calendar}-${event.uid || index}-${start}`,
		calendar: event.calendar,
		summary,
		tone: eventTone(summary),
		location: spaceText(event.location),
		description: parseDescription(event.description),
		all_day,
		start_key,
		end_key: end_key < start_key ? start_key : end_key,
		start_time: all_day ? '' : start.slice(11, 16),
		end_time: all_day ? '' : end.slice(11, 16),
		groups,
		group_text: groupText(event.calendar, groups)
	}
}

export function parseEvents(rows) {
	return (rows || []).map(parseEvent).filter(Boolean)
}

function compareInDay(a, b) {
	const a_long = a.all_day || a.start_key !== a.end_key
	const b_long = b.all_day || b.start_key !== b.end_key
	if (a_long !== b_long) return a_long ? -1 : 1
	if (a.start_time !== b.start_time) return a.start_time < b.start_time ? -1 : 1
	return a.summary < b.summary ? -1 : 1
}

function compareInGrid(a, b) {
	const a_span = dayDiff(a.start_key, a.end_key)
	const b_span = dayDiff(b.start_key, b.end_key)
	if (a_span !== b_span) return b_span - a_span
	if (a.start_key !== b.start_key) return a.start_key < b.start_key ? -1 : 1
	return compareInDay(a, b)
}

export function monthRange(year, month) {
	const first_key = `${year}-${pad(month)}-01`
	return [first_key, addDays(first_key, new Date(Date.UTC(year, month, 0)).getUTCDate() - 1)]
}

// 有適用對象的分類展開成各個對象, 其餘分類就是自己, 全部平行放在同一層
export function calendarOptions(calendars) {
	const options = []
	for (const item of calendars) {
		const groups = CALENDAR_GROUPS[item.key]
		if (!groups) options.push({ value: item.key, label: item.name, description: CALENDAR_NOTES[item.key] })
		else for (const group of groups) options.push({ value: `${item.key}${GROUP_SEPARATOR}${group.key}`, label: group.name })
	}
	return options
}

// 沒有指定對象的活動 (例如未知的 group 值) 一律留著, 才不會整個被篩掉
export function filterByCategory(events, value) {
	const [calendar, group] = String(value).split(GROUP_SEPARATOR)
	return events.filter(event => event.calendar === calendar && (!group || !event.groups.length || event.groups.includes(group)))
}

export function groupByDay(events, from_key, to_key) {
	const day_map = new Map()
	for (const event of events) {
		const start = event.start_key < from_key ? from_key : event.start_key
		const end = event.end_key > to_key ? to_key : event.end_key
		if (start > end) continue
		for (let key = start; key <= end; key = addDays(key, 1)) {
			if (!day_map.has(key)) day_map.set(key, [])
			day_map.get(key).push({ ...event, time_text: formatEventTime(event, key) })
		}
	}
	const today = todayKey()
	return [...day_map.keys()].sort().map(key => ({
		key,
		label: formatDayLabel(key),
		is_today: key === today,
		events: day_map.get(key).sort(compareInDay)
	}))
}

function packLanes(week_start, week_end, events) {
	const lanes = []
	for (const event of [...events].sort(compareInGrid)) {
		if (event.end_key < week_start || event.start_key > week_end) continue
		const from = event.start_key < week_start ? week_start : event.start_key
		const to = event.end_key > week_end ? week_end : event.end_key
		const col = dayDiff(week_start, from) + 1
		const span = dayDiff(from, to) + 1
		const item = {
			event,
			col,
			span,
			is_start: event.start_key === from,
			is_end: event.end_key === to
		}
		let lane = lanes.find(items => items.every(other => other.col + other.span <= col || col + span <= other.col))
		if (!lane) {
			lane = []
			lanes.push(lane)
		}
		lane.push(item)
	}
	while (lanes.length < MIN_LANES) lanes.push([])
	return lanes.map(items => items.sort((a, b) => a.col - b.col))
}

export function buildWeeks(year, month, events) {
	const month_key = `${year}-${pad(month)}`
	const first_key = `${month_key}-01`
	const day_count = new Date(Date.UTC(year, month, 0)).getUTCDate()
	const offset = weekdayOf(first_key)
	const grid_start = addDays(first_key, -offset)
	const today = todayKey()
	const weeks = []
	for (let index = 0; index < Math.ceil((offset + day_count) / 7); index++) {
		const week_start = addDays(grid_start, index * 7)
		const week_end = addDays(week_start, 6)
		const days = []
		for (let day = 0; day < 7; day++) {
			const key = addDays(week_start, day)
			days.push({
				key,
				label: String(Number(key.slice(8, 10))),
				in_month: key.slice(0, 7) === month_key,
				is_today: key === today
			})
		}
		weeks.push({ key: week_start, days, lanes: packLanes(week_start, week_end, events) })
	}
	return weeks
}

function calendarOrder(key) {
	const index = CALENDAR_ORDER.indexOf(key)
	return index < 0 ? CALENDAR_ORDER.length : index
}

function sortCalendars(calendars) {
	return [...calendars].sort((a, b) => calendarOrder(a.key) - calendarOrder(b.key))
}

function monthOffset(year, month, delta) {
	const date = new Date(Date.UTC(year, month - 1 + delta, 1))
	return [date.getUTCFullYear(), date.getUTCMonth() + 1]
}

async function fetchMonth(year, month, options) {
	const [prev, current, next] = await Promise.all([
		getCalendar(...monthOffset(year, month, -1), options).catch(() => null),
		getCalendar(year, month, options),
		getCalendar(...monthOffset(year, month, 1), options).catch(() => null)
	])
	const seen = new Set()
	const list = []
	for (const rows of [prev?.data, current.data, next?.data]) {
		for (const row of rows || []) {
			const id = `${row.calendar}-${row.uid}-${row.start}`
			if (seen.has(id)) continue
			seen.add(id)
			list.push(row)
		}
	}
	return { calendars: sortCalendars(current.calendars || []), data: list }
}

// 只是把資料暖進 api 快取, 不接結果也不強制重抓, 失敗就當作沒預載
function preloadMonths(year, month) {
	for (const delta of [-PRELOAD_OFFSET, PRELOAD_OFFSET]) {
		const [target_year, target_month] = monthOffset(year, month, delta)
		getCalendar(target_year, target_month).catch(() => {})
	}
}

export function useCalendarMonth() {
	const today = todayKey()
	const year = ref(Number(today.slice(0, 4)))
	const month = ref(Number(today.slice(5, 7)))

	const { data, loading, loaded, load_error, load } = createLoader(fetchMonth, () => ({ calendars: [], data: [] }))

	const calendars = computed(() => data.value.calendars)
	const events = computed(() => parseEvents(data.value.data))
	const month_key = computed(() => `${year.value}-${pad(month.value)}`)
	const month_label = computed(() => formatMonthLabel(year.value, month.value))
	const is_current_month = computed(() => month_key.value === today.slice(0, 7))

	// 預載要等當月載完才發, 避免搶頻寬; 期間使用者又換月或載入失敗就不預載
	async function loadMonth(options = {}) {
		const target_year = year.value
		const target_month = month.value
		await load(target_year, target_month, options)
		if (load_error.value || year.value !== target_year || month.value !== target_month) return
		preloadMonths(target_year, target_month)
	}

	function goMonth(delta) {
		const [next_year, next_month] = monthOffset(year.value, month.value, delta)
		year.value = next_year
		month.value = next_month
	}

	function goToday() {
		year.value = Number(today.slice(0, 4))
		month.value = Number(today.slice(5, 7))
	}

	watch(month_key, () => loadMonth())

	return { today, year, month, month_key, month_label, is_current_month, calendars, events, loading, loaded, load_error, loadMonth, goMonth, goToday }
}
