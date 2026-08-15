export function isSummerTerm(term) {
	return Number(term) >= 3
}

export function normalizeTermId(term_id) {
	if (!term_id) return ''
	const [year, term] = term_id.split('-')
	return isSummerTerm(term) ? `${year}-3` : term_id
}

export function yearFromCourseId(id) {
	return id.slice(0, 3)
}

export function termFromCourseId(id) {
	return id.slice(3, 4)
}

export function shortTermIdFromCourseId(id) {
	return id.slice(0, 4)
}

export function termIdFromCourseId(id) {
	return normalizeTermId(`${yearFromCourseId(id)}-${termFromCourseId(id)}`)
}

export function formatTermName(term) {
	return isSummerTerm(term) ? '暑修' : `第 ${term} 學期`
}

export function formatTermLabel(term_id) {
	if (!term_id) return ''
	const [year, term] = term_id.split('-')
	return `${year} 學年${formatTermName(term)}`
}

export function formatTermShort(term_id) {
	if (!term_id) return ''
	const [year, term] = term_id.split('-')
	return isSummerTerm(term) ? `${year} 暑` : `${term_id}`
}
