import { ref, watch } from 'vue'
import { useAuth } from '@/lib/auth'
import { toast } from '@/components/ui/sonner'

// 本機改動後延遲多久推上伺服器, 期間再有改動就往後延
const PUSH_DELAY = 500

// 連續改動 (例如拖曳滑桿) 時最多延後多久, 超過就直接推一次
const PUSH_MAX_DELAY = 5 * 1000

const PUSH_RETRY_DELAY = 5 * 1000

// 分頁重新可見時, 距上次同步超過這個時間才重抓
const RESYNC_INTERVAL = 10 * 1000

const { auth_token, is_logged_in } = useAuth()

export function createSync({ error_title, hasPending, push, fetchRemote, applyRemote, onLogout }) {
	const syncing = ref(false)
	const sync_error = ref('')

	let push_timer = null
	let pushing = false
	let pending_since = 0
	let last_sync_at = 0

	async function pushPending() {
		if (!auth_token.value || pushing) return
		if (!hasPending()) return
		pushing = true
		try {
			await push(auth_token.value)
			sync_error.value = ''
			pending_since = 0
			if (hasPending()) schedulePush()
		} catch (error) {
			console.error(error)
			if (error.status === 401) return
			sync_error.value = error.message
			if (error.status !== 429 && error.status >= 400 && error.status < 500) return
			clearTimeout(push_timer)
			push_timer = setTimeout(pushPending, PUSH_RETRY_DELAY)
		} finally {
			pushing = false
		}
	}

	function schedulePush() {
		if (!is_logged_in.value) return
		if (!pending_since) pending_since = Date.now()
		else if (Date.now() - pending_since >= PUSH_MAX_DELAY) return pushPending()
		clearTimeout(push_timer)
		push_timer = setTimeout(pushPending, PUSH_DELAY)
	}

	async function sync() {
		if (!auth_token.value || syncing.value) return
		syncing.value = true
		try {
			const data = await fetchRemote(auth_token.value)
			sync_error.value = ''
			await applyRemote(data)
		} catch (error) {
			console.error(error)
			if (error.status !== 401) sync_error.value = error.message
		} finally {
			last_sync_at = Date.now()
			syncing.value = false
		}
	}

	function resync() {
		if (!is_logged_in.value) return
		if (Date.now() - last_sync_at < RESYNC_INTERVAL) return
		sync()
	}

	function onVisibilityChange() {
		if (!is_logged_in.value) return
		if (document.visibilityState === 'hidden') {
			clearTimeout(push_timer)
			return pushPending()
		}
		resync()
	}

	function start() {
		const stop_login_watch = watch(is_logged_in, (logged_in, was_logged_in) => {
			if (logged_in) return sync()
			clearTimeout(push_timer)
			pending_since = 0
			last_sync_at = 0
			sync_error.value = ''
			onLogout(was_logged_in === true)
		}, { immediate: true })
		const stop_error_watch = watch(sync_error, message => {
			if (message) toast.error(error_title, { description: message })
		})
		document.addEventListener('visibilitychange', onVisibilityChange)
		return () => {
			stop_login_watch()
			stop_error_watch()
			document.removeEventListener('visibilitychange', onVisibilityChange)
			clearTimeout(push_timer)
		}
	}

	return { syncing, sync_error, schedulePush, pushPending, sync, resync, start }
}
