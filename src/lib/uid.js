import { ref, watch, toValue, onMounted } from 'vue'
import { useAuth } from '@/lib/auth'

export function formatUid(uid) {
	const text = String(uid || '').replace(/\s+/g, '').toUpperCase()
	return /^[0-9A-Z]{8}$/.test(text) && !text.startsWith('U') ? `U${text}` : text
}

export function isValidUid(uid) {
	return /^U[0-9A-Z]{8}$/.test(formatUid(uid))
}

export function useUidSearch(config) {
	const { searched_uid, load } = config
	const { profile, loadProfile, updateUid } = useAuth()

	// 刻意不用 useLocalRef: 學號格式正確才寫入 localStorage, 各查詢頁共用同一組學號
	const uid_input = ref(localStorage.getItem('mcv2-uid') || '')
	const format_error = ref(false)

	function search() {
		const uid = formatUid(uid_input.value)
		uid_input.value = uid
		format_error.value = !isValidUid(uid)
		if (!format_error.value) {
			localStorage.setItem('mcv2-uid', uid)
			updateUid(uid)
		}
		load(uid)
	}

	function retry() {
		load(uid_input.value, { force: true })
	}

	onMounted(() => {
		loadProfile()
		if (uid_input.value && formatUid(uid_input.value) !== toValue(searched_uid)) search()
	})

	watch(() => profile.value?.uid, (uid) => {
		if (!uid || uid_input.value) return
		uid_input.value = formatUid(uid)
		search()
	}, { immediate: true })

	return { uid_input, format_error, search, retry }
}
