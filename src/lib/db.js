let db_promise = null

function openDb() {
	if (db_promise) return db_promise
	db_promise = new Promise((resolve, reject) => {
		const request = indexedDB.open('mcv2', 2)
		request.onupgradeneeded = () => {
			const db = request.result
			for (const store of ['course_list', 'images']) {
				if (!db.objectStoreNames.contains(store)) {
					db.createObjectStore(store)
				}
			}
		}
		request.onsuccess = () => resolve(request.result)
		request.onerror = () => reject(request.error)
	})
	db_promise.catch(() => {
		db_promise = null
	})
	return db_promise
}

export async function idbGet(store_name, key) {
	const db = await openDb()
	return new Promise((resolve, reject) => {
		const tx = db.transaction(store_name, 'readonly')
		const request = tx.objectStore(store_name).get(key)
		request.onsuccess = () => resolve(request.result)
		request.onerror = () => reject(request.error)
	})
}

export async function idbSet(store_name, key, value) {
	const db = await openDb()
	return new Promise((resolve, reject) => {
		const tx = db.transaction(store_name, 'readwrite')
		tx.objectStore(store_name).put(value, key)
		tx.oncomplete = () => resolve()
		tx.onerror = () => reject(tx.error)
	})
}

export async function idbKeys(store_name) {
	const db = await openDb()
	return new Promise((resolve, reject) => {
		const tx = db.transaction(store_name, 'readonly')
		const request = tx.objectStore(store_name).getAllKeys()
		request.onsuccess = () => resolve(request.result)
		request.onerror = () => reject(request.error)
	})
}

export async function idbDelete(store_name, key) {
	const db = await openDb()
	return new Promise((resolve, reject) => {
		const tx = db.transaction(store_name, 'readwrite')
		tx.objectStore(store_name).delete(key)
		tx.oncomplete = () => resolve()
		tx.onerror = () => reject(tx.error)
	})
}

export async function idbClear(store_name) {
	const db = await openDb()
	return new Promise((resolve, reject) => {
		const tx = db.transaction(store_name, 'readwrite')
		tx.objectStore(store_name).clear()
		tx.oncomplete = () => resolve()
		tx.onerror = () => reject(tx.error)
	})
}
