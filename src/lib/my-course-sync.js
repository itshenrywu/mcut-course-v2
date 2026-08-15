import { ref, watch } from 'vue'
import { getMyCourse, putMyCourse, getMyImage, putMyImage, deleteMyImage } from '@/api/user'
import { useAuth } from '@/lib/auth'
import { createSync } from '@/lib/sync'
import { useMyCourse, useMyStyle, myCourseDocument, normalizeMyCourseDocument, applyMyCourseDocument, resetMyCourse } from '@/lib/my-course'
import { onMyBgImageChange, readMyBgImage, applyMyBgImage, canUploadImage } from '@/lib/my-course-image'

// 沒有課程且樣式全預設的課表, 用來判斷某一邊是不是空的 (空的就不必問使用者)
const EMPTY_DOCUMENT_JSON = JSON.stringify(normalizeMyCourseDocument(null))

const { auth_token, is_logged_in } = useAuth()
const { my_courses } = useMyCourse()
const { my_style } = useMyStyle()

const remote_document = ref(normalizeMyCourseDocument(null))
const remote_last_updated = ref('')
const remote_image_token = ref('')
const conflict_open = ref(false)
const image_loading = ref(false)

let pending_document = localStorage.getItem('mcv2-my-pending') === '1'
let pending_image = localStorage.getItem('mcv2-my-image-pending') === '1'
let image_token = localStorage.getItem('mcv2-my-image') || ''
let applying = false

function setPendingDocument(value) {
	if (pending_document === value) return
	pending_document = value
	if (value) localStorage.setItem('mcv2-my-pending', '1')
	else localStorage.removeItem('mcv2-my-pending')
}

function setPendingImage(value) {
	if (pending_image === value) return
	pending_image = value
	if (value) localStorage.setItem('mcv2-my-image-pending', '1')
	else localStorage.removeItem('mcv2-my-image-pending')
}

function setImageToken(value) {
	image_token = value
	if (value) localStorage.setItem('mcv2-my-image', value)
	else localStorage.removeItem('mcv2-my-image')
}

function hasPending() {
	return pending_document || pending_image
}

function markSynced() {
	localStorage.setItem('mcv2-my-synced', '1')
}

function clearSyncState() {
	setPendingDocument(false)
	setPendingImage(false)
	setImageToken('')
	localStorage.removeItem('mcv2-my-synced')
}

function applyDocument(document) {
	applying = true
	try {
		applyMyCourseDocument(document)
	} finally {
		applying = false
	}
}

async function hasLocalImage() {
	return Boolean(await readMyBgImage())
}

// 雲端還是舊版格式 (陣列) 時後端只還原課程, style 一律回空物件, 樣式只能以本地為準, 見 MIGRATION.md
// 新版推上去的一定帶齊所有樣式欄位, 所以空物件就代表這份還沒被新版覆寫過
function isLegacyRemote(my) {
	return Boolean(my) && Object.keys(my.style || {}).length === 0
}

function onLocalChange() {
	if (applying || conflict_open.value || !is_logged_in.value) return
	setPendingDocument(true)
	schedulePush()
}

function onImageChange() {
	if (conflict_open.value || !is_logged_in.value) return
	setPendingImage(true)
	schedulePush()
}

async function pushDocument(token) {
	const document = myCourseDocument()
	const sent_json = JSON.stringify(document)
	if (sent_json === JSON.stringify(remote_document.value)) {
		setPendingDocument(false)
		return
	}
	const data = await putMyCourse(token, document)
	remote_document.value = document
	remote_last_updated.value = String(data?.last_updated || '')
	markSynced()
	if (JSON.stringify(myCourseDocument()) === sent_json) setPendingDocument(false)
}

async function pushImage(token) {
	const blob = await readMyBgImage()
	if (blob && !canUploadImage(blob)) {
		setPendingImage(false)
		return
	}
	if (!blob && !remote_image_token.value) {
		setImageToken('')
		setPendingImage(false)
		return
	}
	const data = blob ? await putMyImage(token, blob) : await deleteMyImage(token)
	const next_token = String(data?.image || '')
	setImageToken(next_token)
	remote_image_token.value = next_token
	setPendingImage(false)
}

async function pullImage(token, next_token) {
	if (next_token === image_token) return
	if (!next_token) {
		await applyMyBgImage(null)
		setImageToken('')
		return
	}
	image_loading.value = true
	try {
		const blob = await getMyImage(token)
		await applyMyBgImage(blob)
		setImageToken(blob ? next_token : '')
	} finally {
		image_loading.value = false
	}
}

async function push(token) {
	if (pending_document) await pushDocument(token)
	if (pending_image) await pushImage(token)
}

async function applyRemote(data) {
	const remote = normalizeMyCourseDocument(data?.my)
	const remote_json = JSON.stringify(remote)
	const remote_image = String(data?.image || '')
	remote_document.value = remote
	remote_last_updated.value = String(data?.last_updated || '')
	remote_image_token.value = remote_image

	if (localStorage.getItem('mcv2-my-synced') !== '1') {
		const local = myCourseDocument()
		const local_json = JSON.stringify(local)
		const local_image = await hasLocalImage()
		const local_empty = local_json === EMPTY_DOCUMENT_JSON && !local_image
		const remote_empty = remote_json === EMPTY_DOCUMENT_JSON && !remote_image
		if (local_empty && remote_empty) return markSynced()
		if (remote_empty) return resolveConflict(false)
		if (local_empty) return resolveConflict(true)
		// 雲端還是舊版格式時樣式並不存在, 拿補上預設值的樣式去比一定不一樣, 只能比課程
		if (isLegacyRemote(data?.my)) {
			if (JSON.stringify(local.courses) === JSON.stringify(remote.courses)) return resolveConflict(false)
			conflict_open.value = true
			return
		}
		if (local_json === remote_json && !local_image && !remote_image) return markSynced()
		conflict_open.value = true
		return
	}

	if (hasPending()) return pushPending()
	try {
		await pullImage(auth_token.value, remote_image)
	} catch (error) {
		console.error(error)
	}
	if (JSON.stringify(myCourseDocument()) === remote_json) return
	applyDocument(remote)
}

function onLogout(logged_out) {
	clearSyncState()
	remote_document.value = normalizeMyCourseDocument(null)
	remote_last_updated.value = ''
	remote_image_token.value = ''
	conflict_open.value = false
	if (!logged_out) return
	applying = true
	resetMyCourse()
	applying = false
	applyMyBgImage(null).catch(console.error)
}

export async function resolveConflict(keep_remote) {
	conflict_open.value = false
	markSynced()
	if (keep_remote) {
		applyDocument(remote_document.value)
		setPendingDocument(false)
		setPendingImage(false)
		try {
			await pullImage(auth_token.value, remote_image_token.value)
		} catch (error) {
			console.error(error)
		}
		return
	}
	setPendingDocument(true)
	setPendingImage(true)
	return pushPending()
}

const { syncing, sync_error, schedulePush, pushPending, resync, start } = createSync({
	error_title: '課表同步失敗',
	hasPending,
	push,
	fetchRemote: getMyCourse,
	applyRemote,
	onLogout
})

watch(my_courses, onLocalChange, { flush: 'sync' })
watch(my_style, onLocalChange, { deep: true, flush: 'sync' })
onMyBgImageChange(onImageChange)

export function startMyCourseSync() {
	return start()
}

export function resyncMyCourse() {
	return resync()
}

export function useMyCourseSync() {
	return { remote_document, remote_last_updated, remote_image_token, conflict_open, image_loading, syncing, sync_error, resolveConflict }
}
