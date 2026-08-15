import { isInAppBrowser } from '@/lib/in-app-browser'
import { isIOS, isMobile } from '@/lib/device'

function canDownloadLink() {
	if (isIOS() || isInAppBrowser()) return false
	return 'download' in HTMLAnchorElement.prototype
}

function downloadBlob(blob, file_name) {
	const url = URL.createObjectURL(blob)
	const link = document.createElement('a')
	link.href = url
	link.download = file_name
	link.click()
	setTimeout(() => URL.revokeObjectURL(url), 1000)
}

async function shareBlob(blob, file_name) {
	if (!navigator.canShare || !navigator.share) return false
	const file = new File([blob], file_name, { type: blob.type })
	if (!navigator.canShare({ files: [file] })) return false
	try {
		await navigator.share({ files: [file] })
	} catch (error) {
		if (error?.name !== 'AbortError') return false
	}
	return true
}

export function blobToDataUrl(blob) {
	return new Promise((resolve, reject) => {
		const reader = new FileReader()
		reader.onload = () => resolve(reader.result)
		reader.onerror = () => reject(reader.error || new Error('read blob failed'))
		reader.readAsDataURL(blob)
	})
}

export async function saveImage(blob, file_name) {
	if (isMobile() && await shareBlob(blob, file_name)) return true
	if (!canDownloadLink()) return false
	downloadBlob(blob, file_name)
	return true
}
