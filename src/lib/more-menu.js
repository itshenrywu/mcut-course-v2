import { computed } from 'vue'
import { Info, Utensils, Footprints, MessageCircleQuestionMark, CalendarClock, CalendarDays, ClipboardList, BookOpen, History, Road, Tickets } from '@lucide/vue'
import { isInTimeRange } from '@/lib/utils'
import { useEnrollTime } from '@/lib/enroll-time'
import { useExamList } from '@/lib/exam'
import { useRouteInfo } from '@/lib/route'
import { usePassportInfo } from '@/lib/passport'

// 選單區塊: to 為站內連結, href 為外部連結, start/end 為顯示時間範圍 (格式 2026-07-29 14:00:00, 可省略)
const MENU_SECTIONS = [
	{
		title: '其他查詢',
		items: [
			{ to: '/calendar', label: '行事曆', icon: CalendarDays },
			{ to: '/english-exam', label: '英文段考時間與考場', icon: ClipboardList },
			{ to: '/english-passport', label: '英語學習護照點數查詢', icon: Tickets },
			{ to: '/goal-course-route', label: '大學之道「環境與行動」路線查詢', icon: Road },
			{ href: 'https://line.me/R/ti/p/@161acthp', label: '學餐菜單 LINE 機器人', icon: Utensils },
			{ href: 'https://mcut-run.henrywu.tw/', label: '歷年校園路跑成績', icon: Footprints }
		]
	},
	{
		title: '說明與支援',
		items: [
			{ to: '/guide', label: '選課指南', icon: BookOpen },
			{ to: '/enroll-time', label: '選課時間及說明', icon: CalendarClock },
			{ to: '/about', label: '關於本站、資料來源及免責聲明', icon: Info },
			{ to: '/changelog', label: '更新紀錄', icon: History },
			{ to: '/contact', label: '建議及問題回報', icon: MessageCircleQuestionMark }
		]
	}
]

export function useMoreMenu() {
	const { has_item: enroll_time_item, has_update: enroll_time_update } = useEnrollTime()
	const { has_item: exam_item, has_update: exam_update, exam_date } = useExamList()
	const { has_item: route_item, has_update: route_update } = useRouteInfo()
	const { has_item: passport_item, has_update: passport_update } = usePassportInfo()

	const state_map = computed(() => ({
		'/enroll-time': { visible: enroll_time_item.value, has_update: enroll_time_update.value },
		'/english-exam': { visible: exam_item.value, has_update: exam_update.value, prefix: exam_date.value },
		'/goal-course-route': { visible: route_item.value, has_update: route_update.value },
		'/english-passport': { visible: passport_item.value, has_update: passport_update.value }
	}))

	const isItemVisible = item => isInTimeRange(item) && (state_map.value[item.to]?.visible ?? true)
	const hasItemUpdate = item => Boolean(state_map.value[item.to]?.has_update)

	function decorateItem(item) {
		const prefix = state_map.value[item.to]?.prefix
		return prefix ? { ...item, label: `${prefix} ${item.label}` } : item
	}

	const visible_sections = computed(() => MENU_SECTIONS
		.map(section => ({ ...section, items: section.items.filter(isItemVisible).map(decorateItem) }))
		.filter(section => section.items.length > 0))

	const has_update = computed(() => visible_sections.value.some(section => section.items.some(hasItemUpdate)))

	return { visible_sections, hasItemUpdate, has_update }
}
