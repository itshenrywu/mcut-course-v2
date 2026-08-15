import { ref, computed } from 'vue'
import { getInfo } from '@/api/info'
import { isInTimeRange } from '@/lib/utils'
import { readJsonItem, writeJsonItem } from '@/lib/storage'

export const ANNOUNCEMENT_LABEL_CLASSES = {
	info: 'bg-sky-600 text-white',
	success: 'bg-emerald-600 text-white',
	warning: 'bg-amber-500 text-white',
	error: 'bg-red-600 text-white',
	DEFAULT: 'bg-color-6 text-white'
}

const announcement_list = ref(readList())
const dismissed_ids = ref(readDismissed())

const current_announcement = computed(() => announcement_list.value.find(isAnnouncementVisible) || null)

function readList() {
	return readJsonItem('mcv2-announcement', [], Array.isArray)
}

function saveList(list) {
	announcement_list.value = list
	writeJsonItem('mcv2-announcement', list)
}

function readDismissed() {
	return new Set(readJsonItem('mcv2-announcement-dismissed', [], Array.isArray))
}

function saveDismissed(ids) {
	dismissed_ids.value = ids
	writeJsonItem('mcv2-announcement-dismissed', [...ids])
}

function isAnnouncementVisible(item) {
	if (!item || !item.content) return false
	if (!isInTimeRange(item)) return false
	return !dismissed_ids.value.has(item.id)
}

function dismissAnnouncement(item) {
	if (!item || !item.can_dismiss || item.id == null) return
	if (dismissed_ids.value.has(item.id)) return
	saveDismissed(new Set([...dismissed_ids.value, item.id]))
}

function pruneDismissed() {
	const ids = new Set(announcement_list.value.map(item => item.id))
	const next = new Set([...dismissed_ids.value].filter(id => ids.has(id)))
	if (next.size !== dismissed_ids.value.size) saveDismissed(next)
}

export async function loadAnnouncement(options = {}) {
	const { force = false } = options
	try {
		const data = await getInfo('pre', { force, label: '前置資料' })
		const list = data?.announcement
		saveList(Array.isArray(list) ? list : [])
		pruneDismissed()
	} catch (error) {
		console.error(error)
	}
}

export function useAnnouncement() {
	return { current_announcement, dismissAnnouncement, loadAnnouncement }
}
