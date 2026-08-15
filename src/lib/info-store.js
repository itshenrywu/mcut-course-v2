import { computed } from 'vue'
import { getInfo, getInfoItem } from '@/api/info'
import { usePreItem } from '@/lib/pre'
import { createLoader } from '@/lib/loader'
import { formatUid, isValidUid } from '@/lib/uid'

export function createInfoStore(key, { label, pre_key, parse, empty }) {
	const { data, loading, loaded, load_error, load } = createLoader(
		async options => parse(await getInfo(key, { ...options, label })),
		empty
	)
	const { item: pre_item, has_item, has_update, markSeen } = usePreItem(key, pre_key)
	return { data, loading, loaded, load_error, load, pre_item, has_item, has_update, markSeen }
}

export function createUidInfoStore(key, { label, pre_key, parse, empty }) {
	const { data, loading, loaded, load_error, load, reset } = createLoader(
		async (uid, options) => ({ uid, result: parse(await getInfoItem(key, uid, { ...options, label })) }),
		() => ({ uid: '', result: empty() })
	)
	const { item: pre_item, has_item, has_update, markSeen } = usePreItem(key, pre_key)

	const searched_uid = computed(() => data.value.uid)
	const result = computed(() => data.value.result)

	function loadByUid(uid, options = {}) {
		const target = formatUid(uid)
		if (!isValidUid(target)) return reset()
		return load(target, options)
	}

	return { result, searched_uid, loading, loaded, load_error, load: loadByUid, pre_item, has_item, has_update, markSeen }
}
