// 圖片等大型二進位資料存 IndexedDB, localStorage 放不下原圖
import { idbGet, idbSet, idbDelete, idbClear } from '@/lib/db'

export async function readBlob(key) {
	try {
		return (await idbGet('images', key)) ?? null
	} catch (error) {
		console.error(error)
		return null
	}
}

export function writeBlob(key, blob) {
	return idbSet('images', key, blob)
}

export async function removeBlob(key) {
	try {
		await idbDelete('images', key)
	} catch (error) {
		console.error(error)
	}
}

export async function clearBlobs() {
	try {
		await idbClear('images')
	} catch (error) {
		console.error(error)
	}
}
