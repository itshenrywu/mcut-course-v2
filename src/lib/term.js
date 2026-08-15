import { ref } from 'vue'
import { readJsonItem, writeJsonItem } from '@/lib/storage'

export * from '@/lib/term-format'
import { normalizeTermId, termIdFromCourseId } from '@/lib/term-format'

// 學期別對應說明 (第 3, 4 學期已合併為暑修, 不需說明)
export const TERM_NOTES = {
	1: '上學期 / 大三前暑期',
	2: '下學期 / 實習期間'
}

export function getStoredTermList() {
	return readJsonItem('mcv2-term-list', [], Array.isArray)
}

export function saveTermList(list) {
	writeJsonItem('mcv2-term-list', list)
}

const selected_term_id = ref(normalizeTermId(localStorage.getItem('mcv2-selected-term-id') || ''))

export function useSelectedTerm() {
	function isTermCourseId(id) {
		return termIdFromCourseId(id) === selected_term_id.value
	}
	return { selected_term_id, isTermCourseId }
}
