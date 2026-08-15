import { ref } from 'vue'
import { readBlob, writeBlob, removeBlob } from '@/lib/image-storage'
import { imageColor, BASE_WIDTH, BASE_HEIGHT } from '@/lib/my-course-canvas'

// 使用者可以選的原始圖片大小上限 (MB), 縮圖後才是實際存下來的大小
export const IMAGE_MAX_MB = 10

// 畫布只把背景畫到 1080x1920, 存原圖沒有意義, 選圖時就縮到剛好覆蓋這個尺寸
// Safari 16 以前不支援 toBlob 產生 webp, 規格規定會靜默退回 png (檔案反而更大), 所以要自己偵測
const IMAGE_QUALITY = 0.85
const IMAGE_TYPES = ['image/webp', 'image/jpeg']

// 後端可接受的格式與大小上限, 超過就一定要用重新編碼過的版本
const IMAGE_UPLOAD_TYPES = ['image/webp', 'image/jpeg', 'image/png']
const IMAGE_UPLOAD_MAX = 2 * 1024 * 1024

const bg_image = ref(null)

let loaded = false
let supported_type = ''
let change_listener = null

export function onMyBgImageChange(listener) {
	change_listener = listener
}

function imageType() {
	if (supported_type) return supported_type
	const canvas = document.createElement('canvas')
	canvas.width = 1
	canvas.height = 1
	supported_type = IMAGE_TYPES.find(type => canvas.toDataURL(type).startsWith(`data:${type}`)) || 'image/jpeg'
	return supported_type
}

export function canUploadImage(blob) {
	return Boolean(blob) && IMAGE_UPLOAD_TYPES.includes(blob.type) && blob.size <= IMAGE_UPLOAD_MAX
}

export async function shrinkImage(blob) {
	const source = await createImageBitmap(blob)
	const scale = Math.min(1, Math.max(BASE_WIDTH / source.width, BASE_HEIGHT / source.height))
	const width = Math.round(source.width * scale)
	const height = Math.round(source.height * scale)
	const canvas = document.createElement('canvas')
	canvas.width = width
	canvas.height = height
	const ctx = canvas.getContext('2d')
	if (!ctx) return blob
	ctx.drawImage(source, 0, 0, width, height)
	source.close()
	const next = await new Promise(resolve => canvas.toBlob(resolve, imageType(), IMAGE_QUALITY))
	if (!next) return blob
	if (!IMAGE_UPLOAD_TYPES.includes(blob.type)) return next
	return blob.size <= next.size && blob.size <= IMAGE_UPLOAD_MAX ? blob : next
}

async function applyBlob(blob) {
	const image = await createImageBitmap(blob)
	const url = URL.createObjectURL(blob)
	if (bg_image.value) URL.revokeObjectURL(bg_image.value.url)
	bg_image.value = { image, url, rgb: imageColor(image) }
}

async function loadMyBgImage() {
	if (loaded) return
	loaded = true
	const blob = await readBlob('my-bg-image')
	if (!blob) return
	try {
		await applyBlob(blob)
	} catch (error) {
		console.error(error)
	}
}

export async function readMyBgImage() {
	return readBlob('my-bg-image')
}

async function saveMyBgImage(blob) {
	const next = await shrinkImage(blob)
	await applyBlob(next)
	await writeBlob('my-bg-image', next)
	change_listener?.()
	return next
}

async function clearMyBgImage() {
	await dropMyBgImage()
	change_listener?.()
}

async function dropMyBgImage() {
	loaded = true
	if (bg_image.value) URL.revokeObjectURL(bg_image.value.url)
	bg_image.value = null
	await removeBlob('my-bg-image')
}

export async function applyMyBgImage(blob) {
	if (!blob) return dropMyBgImage()
	loaded = true
	await applyBlob(blob)
	await writeBlob('my-bg-image', blob)
}

export function useMyBgImage() {
	return { bg_image, loadMyBgImage, saveMyBgImage, clearMyBgImage }
}
