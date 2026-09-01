import { computed } from 'vue'
import { createInfoStore, createUidInfoStore } from '@/lib/info-store'
import { cleanText } from '@/lib/utils'

const ROUTE_STORE_OPTIONS = {
	label: '踏查路線',
	pre_key: 'mcv2-route-id'
}

const { data: route_info, loaded: info_loaded, load_error: info_error, load: loadRouteInfo } = createInfoStore('goal-course-route', {
	...ROUTE_STORE_OPTIONS,
	label: '踏查路線說明',
	parse: data => ({
		mode: data?.mode === 'uid' ? 'uid' : 'route',
		description: cleanText(data?.description),
		locked_description: cleanText(data?.locked_description)
	}),
	empty: () => ({ mode: 'route', description: '', locked_description: '' })
})

const { data: route_list, loading: list_loading, load_error: list_error, load: loadRouteList } = createInfoStore('goal-course-route/list', {
	...ROUTE_STORE_OPTIONS,
	parse: data => Array.isArray(data?.data) ? data.data : [],
	empty: () => []
})

const { result: my_route_list, searched_uid, loading, load_error, has_item, has_update, load: loadRoute, markSeen: markRouteSeen } = createUidInfoStore('goal-course-route', {
	...ROUTE_STORE_OPTIONS,
	parse: result => Array.isArray(result?.data) ? result.data : [],
	empty: () => []
})

const route_item = computed(() => my_route_list.value[0] || null)

const route_mode = computed(() => route_info.value.mode)

const route_description_list = computed(() => route_info.value.description.split('\n').filter(Boolean))

const route_locked_description = computed(() => route_info.value.locked_description)

function routeTimeLabel(key) {
	return key.match(/[（(](.+?)[）)]/)?.[1] || key
}

function routeMainTime(item) {
	const entry = Object.entries(item?.time || {}).find(([key]) => routeTimeLabel(key).includes('踏查'))
	return cleanText(entry?.[1])
}

export function routeOptions(list) {
	return list.map(route => ({
		value: String(route.route_id),
		label: [route.route_id, route.title].map(cleanText).filter(Boolean).join(' - '),
		description: routeMainTime(route)
	}))
}

export function routeSignupUrl(item, mode) {
	return mode === 'route' ? cleanText(item?.signup_url) : ''
}

export function routeRowList(item) {
	if (!item) return []
	const time_rows = Object.entries(item.time || {}).map(([key, value]) => ({
		label: routeTimeLabel(key),
		value: cleanText(value)
	}))
	const meeting_row = { label: '集合地點', value: cleanText(item.meeting_point) }
	const meeting_index = time_rows.findIndex(row => row.label.includes('踏查'))
	if (meeting_index === -1) time_rows.push(meeting_row)
	else time_rows.splice(meeting_index + 1, 0, meeting_row)
	const name = cleanText(item.name)
	const transport = cleanText(item.transport)
	const capacity = cleanText(item.capacity)
	return [
		...(name ? [{ label: '姓名', value: name }] : []),
		{ label: '路線', value: [item.route_id, item.title].map(cleanText).filter(Boolean).join(' - ') },
		{ label: '講師', value: cleanText(item.teacher) },
		{ label: '路線簡介', value: cleanText(item.description) },
		...time_rows,
		...(transport ? [{ label: '交通方式', value: transport }] : []),
		...(capacity ? [{ label: '人數上限', value: capacity, dd_class: 'font-num tabular-nums' }] : [])
	]
}

export function useRouteInfo() {
	return {
		route_item,
		route_list,
		route_mode,
		route_description_list,
		route_locked_description,
		info_loaded,
		info_error,
		searched_uid,
		loading,
		load_error,
		list_loading,
		list_error,
		has_item,
		has_update,
		loadRoute,
		loadRouteInfo,
		loadRouteList,
		markRouteSeen
	}
}
