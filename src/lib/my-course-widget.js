import { ref, watch } from 'vue'
import { readJsonItem, writeJsonItem } from '@/lib/storage'
import { SECTION_TIME } from '@/lib/course-format'
import { isHexColor } from '@/lib/my-course'
import WIDGET_SCRIPT from '@/assets/scriptable-widget.js?raw'

// Scriptable 在 App Store 的頁面, 小工具需要先裝這個 App
export const SCRIPTABLE_URL = 'https://apps.apple.com/tw/app/scriptable/id1405459188'

// 小工具的配色欄位 (背景漸層起訖色與文字色), 依設定區的排版分列: 第一列背景與漸層各半, 第二列文字整列
export const WIDGET_COLOR_ROWS = [
	[
		{ key: 'bg_color', label: '背景' },
		{ key: 'bg_color2', label: '漸層', gradient: true }
	],
	[{ key: 'text_color', label: '文字' }]
]

export const WIDGET_COLOR_FIELDS = WIDGET_COLOR_ROWS.flat()

const DEFAULT_COLOR = {
	bg_color: '#487eb0',
	bg_color2: '#341f97',
	text_color: '#ffffff',
	gradient: true
}

function normalizeColor(value) {
	const color = { ...DEFAULT_COLOR }
	for (const field of WIDGET_COLOR_FIELDS) {
		if (isHexColor(value[field.key])) color[field.key] = value[field.key].toLowerCase()
	}
	if (typeof value.gradient === 'boolean') color.gradient = value.gradient
	return color
}

const widget_color = ref(normalizeColor(readJsonItem('mcv2-my-widget', {}, value => Boolean(value) && typeof value === 'object' && !Array.isArray(value))))

watch(widget_color, value => writeJsonItem('mcv2-my-widget', value), { deep: true })

export function useWidgetColor() {
	return { widget_color }
}

// 注入腳本的顏色: [背景起色, 背景迄色, 文字色], 不開漸層時起迄同色
export function widgetColors(color) {
	return [color.bg_color, color.gradient ? color.bg_color2 : color.bg_color, color.text_color]
}

// 注入腳本的課表: 以星期為 key (與 Date#getDay 對應), 課程依開始時間排序
function widgetTimetable(courses) {
	const timetable = {}
	for (const course of [...courses].sort((a, b) => a.start - b.start)) {
		const start = SECTION_TIME[course.start]
		const end = SECTION_TIME[course.end]
		if (!start || !end) continue
		if (!timetable[course.day]) timetable[course.day] = []
		timetable[course.day].push({ n: course.name, r: course.remark || '', s: start[0], e: end[1] })
	}
	return timetable
}

// JSON 的行分隔符在 JS 字面值裡不合法, 要跳脫後才能貼進腳本
function toLiteral(value) {
	return JSON.stringify(value).replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029')
}

export function buildWidgetCode(courses, color) {
	return WIDGET_SCRIPT
		.replace('__COLOR__', () => toLiteral(widgetColors(color)))
		.replace('__DATA__', () => toLiteral(widgetTimetable(courses)))
		.trim()
}
