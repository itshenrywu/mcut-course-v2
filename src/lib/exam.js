import { computed } from 'vue'
import { createInfoStore } from '@/lib/info-store'
import { parseRowFields } from '@/lib/utils'

// 考場每列的欄位順序
const EXAM_FIELDS = ['class_name', 'course', 'teacher', 'date', 'time', 'place']

// 課程名稱對應的年級
const GRADE_LABEL_MAP = {
	'生活與職場英文': '大一',
	'整合式大學英語': '大一',
	'英語聽講': '大二'
}

// 班級的分級 (排在班級名稱的學院之後)
const LEVEL_LIST = ['菁英', '初', '中', '高']

// 拆解班級名稱為學院/分級/班別的 regex
const CLASS_NAME_REGEX = new RegExp(`^(.*?)(${LEVEL_LIST.join('|')})\\s*(.*)$`)

const { data: exam_list, loading, loaded, load_error, load: loadExamList, pre_item, has_item, has_update, markSeen: markExamSeen } = createInfoStore('english-exam', {
	label: '英文段考考場',
	pre_key: 'mcv2-exam-id',
	parse: data => Array.isArray(data?.data) ? data.data.map(parseExamItem) : [],
	empty: () => []
})

const exam_date = computed(() => String(pre_item.value?.date || ''))

function splitClassName(class_name) {
	const match = (class_name || '').match(CLASS_NAME_REGEX)
	if (!match) return { college: '', level: '', section: '', class_label: class_name || '' }
	const [, college, level, section] = match
	return { college, level, section, class_label: [level, section].filter(Boolean).join(' ') }
}

function parseExamItem(row) {
	const item = parseRowFields(row, EXAM_FIELDS)
	return { ...item, ...splitClassName(item.class_name) }
}

export function examGrades(list) {
	const map = new Map()
	for (const item of list) {
		if (!item.course || map.has(item.course)) continue
		map.set(item.course, { course: item.course, label: GRADE_LABEL_MAP[item.course] || item.course })
	}
	return [...map.values()]
}

export function examColleges(list) {
	return [...new Set(list.map(item => item.college).filter(Boolean))]
}

export function examLevels(list) {
	return [...new Set(list.map(item => item.level).filter(Boolean))]
}

export function useExamList() {
	return { exam_list, exam_date, loading, loaded, load_error, has_item, has_update, loadExamList, markExamSeen }
}
