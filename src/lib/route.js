import { computed } from 'vue'
import { createUidInfoStore } from '@/lib/info-store'
import { cleanText } from '@/lib/utils'

// 集合地點要插在這個時段的下方
const MEETING_POINT_AFTER = '實作踏查'

const { result: route_list, searched_uid, loading, load_error, has_item, has_update, load: loadRoute, markSeen: markRouteSeen } = createUidInfoStore('goal-course-route', {
	label: '踏查路線',
	pre_key: 'mcv2-route-id',
	parse: result => Array.isArray(result?.data) ? result.data : [],
	empty: () => []
})

const route_item = computed(() => route_list.value[0] || null)

function routeTimeLabel(key) {
	return key.match(/[（(](.+?)[）)]/)?.[1] || key
}

export function routeRowList(item) {
	if (!item) return []
	const time_rows = Object.entries(item.time || {}).map(([key, value]) => ({
		label: routeTimeLabel(key),
		value: cleanText(value)
	}))
	const meeting_row = { label: '集合地點', value: cleanText(item.meeting_point) }
	const meeting_index = time_rows.findIndex(row => row.label.includes(MEETING_POINT_AFTER))
	if (meeting_index === -1) time_rows.push(meeting_row)
	else time_rows.splice(meeting_index + 1, 0, meeting_row)
	return [
		{ label: '姓名', value: cleanText(item.name) },
		{ label: '路線', value: [item.route_id, item.title].map(cleanText).filter(Boolean).join(' - ') },
		{ label: '講師', value: cleanText(item.teacher) },
		{ label: '路線簡介', value: cleanText(item.description) },
		...time_rows
	]
}

export function useRouteInfo() {
	return { route_item, searched_uid, loading, load_error, has_item, has_update, loadRoute, markRouteSeen }
}
