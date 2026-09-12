import { ref } from 'vue'
import { API_BASE_URL } from '@/config'

export const stage_locked = ref(false)

export function stageKeyHeaders() {
	const key = localStorage.getItem('mcv2-stage-key')
	return key ? { 'X-Stage-Key': key } : {}
}

export async function reportStageLock(response) {
	if (response.status !== 403) return
	const data = await response.clone().json().catch(() => null)
	if (data?.error === 'stage_locked') stage_locked.value = true
}

export async function unlockStage(key) {
	const response = await fetch(`${API_BASE_URL}/course/rev`, { headers: { 'X-Stage-Key': key } })
	if (response.status === 403) return false
	if (!response.ok) throw new Error(`驗證失敗: ${response.status}`)
	localStorage.setItem('mcv2-stage-key', key)
	return true
}
