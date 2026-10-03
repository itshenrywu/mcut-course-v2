import { formatDateTime } from '@/lib/utils'

const reload_channel = window.BroadcastChannel ? new BroadcastChannel('mcv2-debug') : null

export function notifyOtherTabs() {
	reload_channel?.postMessage('reload')
}

export function formatBytes(bytes) {
	if (bytes < 1024) return `${bytes} B`
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
	if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`
	return `${(bytes / 1024 / 1024 / 1024).toFixed(1)} GB`
}

function textSize(text) {
	return new Blob([text]).size
}

export function isSecretKey(key) {
	return ['mcv2-auth-token', 'mcv2-stage-key', 'auth_key'].includes(key)
}

function isPrivateKey(key) {
	return isSecretKey(key) || ['mcv2-uid', 'mcv2-profile', 'uid', 'profile_name'].includes(key)
}

export function readStorageEntries(storage_name) {
	try {
		const storage = window[storage_name]
		return Object.keys(storage).sort().map(key => {
			const value = storage.getItem(key) ?? ''
			return { key, value, size: textSize(value) }
		})
	} catch {
		return []
	}
}

export function removeStorageEntry(storage_name, key) {
	try {
		window[storage_name].removeItem(key)
	} catch {}
}

export function readCookies() {
	return document.cookie.split(';').map(part => part.trim()).filter(Boolean).map(part => {
		const index = part.indexOf('=')
		const key = index < 0 ? part : part.slice(0, index)
		const value = index < 0 ? '' : part.slice(index + 1)
		return { key, value, size: textSize(value) }
	})
}

export function removeCookie(name) {
	const host_parts = location.hostname.split('.')
	const domains = ['']
	for (let i = 0; i < host_parts.length - 1; i++) domains.push(host_parts.slice(i).join('.'))
	for (const domain of domains) {
		const suffix = domain ? `; domain=${domain}` : ''
		document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/${suffix}`
	}
}

function transactionDone(tx) {
	return new Promise((resolve, reject) => {
		tx.oncomplete = () => resolve()
		tx.onerror = () => reject(tx.error)
		tx.onabort = () => reject(tx.error)
	})
}

// 不帶版本號開, 資料庫不存在時會進 upgradeneeded, 在這裡 abort 才不會為了看一眼就建出空的資料庫
function openExisting(name) {
	return new Promise(resolve => {
		try {
			const request = indexedDB.open(name)
			request.onupgradeneeded = () => request.transaction.abort()
			request.onsuccess = () => resolve(request.result)
			request.onerror = event => {
				event.preventDefault()
				resolve(null)
			}
		} catch {
			resolve(null)
		}
	})
}

async function withDatabase(name, run) {
	const db = await openExisting(name)
	if (!db) return null
	try {
		return await run(db)
	} finally {
		db.close()
	}
}

export async function listDatabases() {
	try {
		if (indexedDB.databases) return (await indexedDB.databases()).filter(db => db.name).sort((a, b) => a.name.localeCompare(b.name))
	} catch {}
	const found = []
	for (const name of ['mcv2', 'mcut-course']) {
		const version = await withDatabase(name, db => db.version)
		if (version) found.push({ name, version })
	}
	return found
}

function valueSize(value) {
	return value instanceof Blob ? value.size : textSize(JSON.stringify(value) ?? '')
}

async function readStore(db, store_name) {
	const entries = []
	const request = db.transaction(store_name, 'readonly').objectStore(store_name).openCursor()
	await new Promise((resolve, reject) => {
		request.onsuccess = () => {
			const cursor = request.result
			if (!cursor) return resolve()
			const key_text = typeof cursor.key === 'string' ? cursor.key : JSON.stringify(cursor.key)
			entries.push({ key: cursor.key, key_text, size: valueSize(cursor.value) })
			cursor.continue()
		}
		request.onerror = () => reject(request.error)
	})
	return { name: store_name, entries, size: entries.reduce((sum, entry) => sum + entry.size, 0) }
}

export async function readDatabase(name) {
	try {
		return await withDatabase(name, async db => ({
			name,
			version: db.version,
			stores: await Promise.all([...db.objectStoreNames].map(store_name => readStore(db, store_name)))
		}))
	} catch (error) {
		return { name, error: String(error?.message || error), stores: [] }
	}
}

export function removeDatabaseEntry(name, store_name, key) {
	return withDatabase(name, db => {
		const tx = db.transaction(store_name, 'readwrite')
		tx.objectStore(store_name).delete(key)
		return transactionDone(tx)
	})
}

export function clearDatabaseStore(name, store_name) {
	return withDatabase(name, db => {
		const tx = db.transaction(store_name, 'readwrite')
		tx.objectStore(store_name).clear()
		return transactionDone(tx)
	})
}

export function deleteDatabase(name) {
	return new Promise(resolve => {
		try {
			const request = indexedDB.deleteDatabase(name)
			request.onsuccess = () => resolve('deleted')
			request.onerror = () => resolve('error')
			request.onblocked = () => resolve('blocked')
		} catch {
			resolve('error')
		}
	})
}

export async function listCaches() {
	try {
		return await caches.keys()
	} catch {
		return []
	}
}

export async function removeCache(name) {
	try {
		await caches.delete(name)
	} catch {}
}

export async function listWorkers() {
	try {
		return await navigator.serviceWorker.getRegistrations()
	} catch {
		return []
	}
}

export async function unregisterWorker(registration) {
	try {
		await registration.unregister()
	} catch {}
}

async function readStorageEstimate() {
	try {
		const [estimate, persisted] = await Promise.all([navigator.storage.estimate(), navigator.storage.persisted()])
		return { usage: estimate.usage, quota: estimate.quota, persisted }
	} catch {
		return null
	}
}

export async function clearAll() {
	try {
		localStorage.clear()
	} catch {}
	try {
		sessionStorage.clear()
	} catch {}
	for (const cookie of readCookies()) removeCookie(cookie.key)
	const databases = await listDatabases()
	const results = await Promise.all(databases.map(db => deleteDatabase(db.name)))
	await Promise.all((await listCaches()).map(removeCache))
	await Promise.all((await listWorkers()).map(unregisterWorker))
	return databases.filter((_, index) => results[index] === 'blocked').map(db => db.name)
}

function redactPrivate(value) {
	if (Array.isArray(value)) return value.map(redactPrivate)
	if (!value || typeof value !== 'object') return value
	return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, isPrivateKey(key) ? '[已隱藏]' : redactPrivate(item)]))
}

function parseStoredValue(value) {
	if (value.length > 10000) return `[已省略 ${formatBytes(textSize(value))}]`
	try {
		return JSON.parse(value)
	} catch {
		return value
	}
}

function storageSnapshot(entries) {
	return redactPrivate(Object.fromEntries(entries.map(entry => [entry.key, parseStoredValue(entry.value)])))
}

export async function buildDiagnostics() {
	const [estimate, database_list, cache_names, workers] = await Promise.all([readStorageEstimate(), listDatabases(), listCaches(), listWorkers()])
	const databases = await Promise.all(database_list.map(db => readDatabase(db.name)))
	return JSON.stringify({
		time: formatDateTime(Date.now(), 'YYYY-MM-DD HH:mm:ss'),
		build: `${formatDateTime(__BUILD_TIME__, 'YYYYMMDDHHmmss')} (${__GIT_SHA__.slice(0, 8)})`,
		api: readStorageEntries('localStorage').find(entry => entry.key === 'mcv2-api-sha')?.value || '',
		user_agent: navigator.userAgent,
		storage: estimate && { usage: formatBytes(estimate.usage), quota: formatBytes(estimate.quota), persisted: estimate.persisted },
		local_storage: storageSnapshot(readStorageEntries('localStorage')),
		session_storage: storageSnapshot(readStorageEntries('sessionStorage')),
		cookies: readCookies().map(cookie => cookie.key),
		indexed_db: databases.map(db => ({
			name: db.name,
			version: db.version,
			error: db.error,
			stores: Object.fromEntries(db.stores.map(store => [store.name, Object.fromEntries(store.entries.map(entry => [entry.key_text, formatBytes(entry.size)]))]))
		})),
		cache_storage: cache_names,
		service_workers: workers.map(registration => registration.scope)
	}, null, 2)
}
