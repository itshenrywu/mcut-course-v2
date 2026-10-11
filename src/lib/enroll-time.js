import { computed } from 'vue'
import { createInfoStore } from '@/lib/info-store'
import { parseRowFields } from '@/lib/utils'
import { isSummerTerm, normalizeTermId } from '@/lib/term'

// 選課時程每列的欄位順序
const ENROLL_TIME_FIELDS = ['name', 'term_id', 'first_enroll', 'add_drop']

// 四技日間部選課學分上下限: [年級, 上學期下限, 上學期上限, 下學期下限, 下學期上限, 暑修上限] (暑修沒有下限)
export const CREDIT_LIMITS = [
	['一年級', 16, 27, 16, 27, 10],
	['二年級', 16, 27, 16, 27, 10],
	['三年級', 9, 27, 9, 32, 10],
	['四年級', 9, 27, 9, 27, 15]
]

const { data: info, loading, loaded, load_error, load: loadEnrollTime, has_item, has_update, markSeen: markEnrollTimeSeen } = createInfoStore('enroll-time', {
	label: '選課時程',
	pre_key: 'mcv2-enroll-time-id',
	parse: data => ({
		list: Array.isArray(data?.data) ? data.data : [],
		term_list: Array.isArray(data?.term_list) ? data.term_list.map(normalizeTermId) : [],
		default_term_id: normalizeTermId(data?.default_term_id)
	}),
	empty: () => ({ list: [], term_list: [], default_term_id: '' })
})

const enroll_list = computed(() => info.value.list.map(parseEnrollTimeItem))
const enroll_term_list = computed(() => [...info.value.term_list].sort())
const enroll_default_term_id = computed(() => info.value.default_term_id)

function parseEnrollTimeItem(row) {
	const item = parseRowFields(row, ENROLL_TIME_FIELDS)
	item.announced = Boolean(item.first_enroll || item.add_drop)
	const limit = findCreditLimit(item.name, item.term_id)
	item.credit_min = limit ? `${limit[0]} 學分` : ''
	item.credit_max = limit ? `${limit[1]} 學分` : ''
	return item
}

function findCreditLimit(name, term_id) {
	const term = Number((term_id || '').split('-')[1])
	if (!term) return null
	const row = CREDIT_LIMITS.find(row => name.includes(row[0]))
	if (!row) return null
	if (isSummerTerm(term)) return ['', row[5]]
	return term === 1 ? [row[1], row[2]] : [row[3], row[4]]
}

export function useEnrollTime() {
	return { enroll_list, enroll_term_list, enroll_default_term_id, loading, loaded, load_error, has_item, has_update, loadEnrollTime, markEnrollTimeSeen }
}
