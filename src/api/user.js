import { API_BASE_URL, AUTH_BASE_URL } from '@/config'
import { recordLoadError } from '@/lib/report'

async function authFetch(url, token, options = {}) {
	const method = options.method || 'GET'
	let response
	try {
		response = await fetch(url, {
			...options,
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${token}`,
				...options.headers
			}
		})
	} catch (error) {
		recordLoadError(method, url, 0, error.message)
		throw error
	}
	if (!response.ok) {
		const data = await response.json().catch(() => null)
		recordLoadError(method, url, response.status, data?.error || '')
		const error = new Error(data?.error || `${method} ${url}: ${response.status}`)
		error.status = response.status
		throw error
	}
	return response
}

export function lineLoginUrl(redirect, state) {
	return `${AUTH_BASE_URL}/line/login?redirect=${encodeURIComponent(redirect)}&state=${encodeURIComponent(state)}`
}

export async function getMe(token) {
	const response = await authFetch(`${API_BASE_URL}/user/me`, token)
	return response.json()
}

export async function patchUid(token, uid) {
	const response = await authFetch(`${API_BASE_URL}/user/uid`, token, {
		method: 'PATCH',
		body: JSON.stringify({ uid })
	})
	return response.json()
}

export async function getAvatar(token) {
	try {
		const response = await authFetch(`${API_BASE_URL}/user/avatar`, token)
		return response.blob()
	} catch (error) {
		if (error.status === 404) return null
		throw error
	}
}

export async function getFavorite(token) {
	const response = await authFetch(`${API_BASE_URL}/user/favorite`, token)
	return response.json()
}

export async function patchFavorite(token, favorite) {
	const response = await authFetch(`${API_BASE_URL}/user/favorite`, token, {
		method: 'PATCH',
		body: JSON.stringify({ favorite })
	})
	return response.json()
}

export async function getMyCourse(token) {
	const response = await authFetch(`${API_BASE_URL}/user/my`, token)
	return response.json()
}

export async function putMyCourse(token, my) {
	const response = await authFetch(`${API_BASE_URL}/user/my`, token, {
		method: 'PUT',
		body: JSON.stringify({ my })
	})
	return response.json()
}

export async function getMyImage(token) {
	try {
		const response = await authFetch(`${API_BASE_URL}/user/my/image`, token)
		return response.blob()
	} catch (error) {
		if (error.status === 404) return null
		throw error
	}
}

export async function putMyImage(token, blob) {
	const response = await authFetch(`${API_BASE_URL}/user/my/image`, token, {
		method: 'PUT',
		headers: { 'Content-Type': blob.type || 'image/jpeg' },
		body: blob
	})
	return response.json()
}

export async function deleteMyImage(token) {
	const response = await authFetch(`${API_BASE_URL}/user/my/image`, token, { method: 'DELETE' })
	return response.json()
}

export async function deleteSession(token) {
	await authFetch(`${AUTH_BASE_URL}/logout`, token, { method: 'DELETE' })
}
