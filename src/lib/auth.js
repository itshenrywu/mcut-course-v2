import { ref, computed } from 'vue'
import { lineLoginUrl, getMe, patchUid, getAvatar, deleteSession } from '@/api/user'
import { clearOnLogout, readJsonItem, writeJsonItem } from '@/lib/storage'
import { readBlob, writeBlob, removeBlob } from '@/lib/image-storage'

const auth_token = ref(localStorage.getItem('mcv2-auth-token') || '')
const profile = ref(readProfileCache())
const profile_image_url = ref('')
const loading = ref(false)
const load_error = ref(false)
const loaded = ref(false)

localStorage.removeItem('mcv2-avatar')
if (auth_token.value) {
	readBlob('avatar').then(blob => {
		if (blob && !profile_image_url.value) profile_image_url.value = URL.createObjectURL(blob)
	}).catch(() => {})
}

const is_logged_in = computed(() => Boolean(auth_token.value))
const hide_ad = computed(() => Boolean(profile.value?.hide_ad))

function readProfileCache() {
	if (!auth_token.value) return null
	return readJsonItem('mcv2-profile', null)
}

function setProfile(value) {
	profile.value = value
	if (value) writeJsonItem('mcv2-profile', value)
	else localStorage.removeItem('mcv2-profile')
}

function setAvatarBlob(blob) {
	if (profile_image_url.value) URL.revokeObjectURL(profile_image_url.value)
	profile_image_url.value = blob ? URL.createObjectURL(blob) : ''
	if (blob) writeBlob('avatar', blob).catch(console.error)
	else removeBlob('avatar')
}

async function loadAvatar() {
	if (!auth_token.value) return
	try {
		const blob = await getAvatar(auth_token.value)
		setAvatarBlob(blob || null)
	} catch (error) {
		console.error(error)
	}
}

function setToken(token) {
	auth_token.value = token
	if (token) localStorage.setItem('mcv2-auth-token', token)
	else localStorage.removeItem('mcv2-auth-token')
}

function loginWithLine(return_path = '') {
	if (return_path) localStorage.setItem('mcv2-login-return', return_path)
	const state = crypto.randomUUID()
	localStorage.setItem('mcv2-login-state', state)
	window.location.href = lineLoginUrl(window.location.origin, state)
}

export function readLoginToken() {
	const params = new URLSearchParams(window.location.hash.slice(1))
	const token = params.get('token')
	if (!token) return 'no_token'
	const state = localStorage.getItem('mcv2-login-state')
	localStorage.removeItem('mcv2-login-state')
	if (!state) return 'no_state'
	const echoed_state = params.get('state')
	if (echoed_state !== state) return 'state_mismatch'
	setToken(token)
	setProfile(null)
	setAvatarBlob(null)
	loaded.value = false
	return 'ok'
}

export function takeLoginReturnPath() {
	const path = localStorage.getItem('mcv2-login-return') || ''
	localStorage.removeItem('mcv2-login-return')
	return path.startsWith('/') && !path.startsWith('//') ? path : '/'
}

export async function loadProfile(options = {}) {
	const { force = false } = options
	if (!auth_token.value) return null
	if (loaded.value && !force) return profile.value
	load_error.value = false
	loading.value = !profile.value
	try {
		setProfile(await getMe(auth_token.value))
		await loadAvatar()
		loaded.value = true
	} catch (error) {
		console.error(error)
		if (error.status === 401) {
			setToken('')
			setProfile(null)
			setAvatarBlob(null)
		} else if (!profile.value) {
			load_error.value = true
		}
	} finally {
		loading.value = false
	}
	return profile.value
}

async function updateUid(uid) {
	if (!auth_token.value || !uid) return
	if (profile.value?.uid === uid) return
	try {
		const data = await patchUid(auth_token.value, uid)
		setProfile(data?.uid ? data : { ...profile.value, uid })
	} catch (error) {
		console.error(error)
	}
}

async function logout() {
	const token = auth_token.value
	setToken('')
	setProfile(null)
	setAvatarBlob(null)
	load_error.value = false
	loaded.value = false
	clearOnLogout()
	if (!token) return
	try {
		await deleteSession(token)
	} catch (error) {
		console.error(error)
	}
}

export function useAuth() {
	return { auth_token, profile, loading, load_error, is_logged_in, hide_ad, profile_image_url, loginWithLine, loadProfile, updateUid, logout }
}
