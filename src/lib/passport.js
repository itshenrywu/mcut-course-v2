import { computed } from 'vue'
import { createUidInfoStore } from '@/lib/info-store'
import { cleanText, spaceText } from '@/lib/utils'

const { result: passport_item, searched_uid, loading, load_error, has_item, has_update, load: loadPassport, markSeen: markPassportSeen } = createUidInfoStore('english-passport', {
	label: '英語學習護照',
	pre_key: 'mcv2-passport-id',
	parse: result => (result?.data && !Array.isArray(result.data) ? result.data : null),
	empty: () => null
})

const total_points = computed(() => Number(passport_item.value?.total_points) || 0)

function activityParts(text) {
	const [name, ...note_parts] = cleanText(text).split( /[,，]/)
	return {
		name: spaceText(cleanText(name)),
		note: spaceText(note_parts.map(part => part.trim()).filter(Boolean).join('，'))
	}
}

export function passportTotalRows(item) {
	return (item?.total || []).map(row => ({
		...activityParts(row.name),
		points: Number(row.points) || 0
	}))
}

export function passportRecordRows(item) {
	return (item?.records || []).map(row => ({
		...activityParts(row.activity),
		date: cleanText(row.date),
		count: Number(row.count) || 0,
		points: Number(row.points) || 0,
		acknowledged: cleanText(row.acknowledged),
		email: cleanText(row.email),
		verified: cleanText(row.verified)
	}))
}

export function usePassportInfo() {
	return { passport_item, total_points, searched_uid, loading, load_error, has_item, has_update, loadPassport, markPassportSeen }
}
