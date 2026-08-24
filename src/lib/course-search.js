import { watch, toValue } from 'vue'
import { searchCourses } from '@/api/course'
import { createLoader } from '@/lib/loader'
import { useSelectedTerm } from '@/lib/term'

const MIN_KEYWORD_LENGTH = 2

function emptyResult() {
	return { total: 0, term_counts: [] }
}

export function useCrossTermSearch(keyword, enabled) {
	const { selected_term_id } = useSelectedTerm()
	const { data, loading, load, reset } = createLoader(
		(kw, term_id) => searchCourses(kw, { exclude_term_id: term_id }),
		emptyResult
	)

	watch(
		() => [toValue(keyword).trim(), toValue(enabled), selected_term_id.value],
		([kw, on, term_id]) => {
			if (!on || kw.length < MIN_KEYWORD_LENGTH) return reset()
			load(kw, term_id)
		},
		{ immediate: true }
	)

	return { result: data, loading }
}
