import { ref, computed, toValue } from 'vue'

export function createLoader(fetcher, empty = null) {
	const emptyValue = () => typeof empty === 'function' ? empty() : empty

	const data = ref(emptyValue())
	const loading = ref(false)
	const loaded = ref(false)
	const load_error = ref(false)
	const startRequest = useLatestRequest()

	async function load(...args) {
		const isLatest = startRequest()
		load_error.value = false
		loading.value = true
		try {
			const result = await fetcher(...args)
			if (!isLatest()) return
			data.value = result
		} catch (error) {
			if (!isLatest()) return
			console.error(error)
			data.value = emptyValue()
			load_error.value = true
		} finally {
			if (isLatest()) {
				loaded.value = true
				loading.value = false
			}
		}
	}

	function reset() {
		startRequest()
		data.value = emptyValue()
		load_error.value = false
		loading.value = false
	}

	return { data, loading, loaded, load_error, load, reset }
}

export function useLatestRequest() {
	let request_id = 0
	return function start() {
		const id = ++request_id
		return () => id === request_id
	}
}

export function useEmptyState(list, state) {
	const { loading, loaded, load_error } = state
	return computed(() =>
		toValue(loaded) && !toValue(loading) && !toValue(load_error) && !toValue(list).length
	)
}
