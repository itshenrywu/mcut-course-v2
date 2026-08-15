<script setup>
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import LoadingOverlay from '@/components/LoadingOverlay.vue'
import { readLoginToken, takeLoginReturnPath, loadProfile, useAuth } from '@/lib/auth'

const router = useRouter()
const { is_logged_in } = useAuth()

onMounted(async () => {
	const reason = readLoginToken()
	const return_path = takeLoginReturnPath()
	if (reason !== 'ok') {
		if (is_logged_in.value) return router.replace(return_path)
		return router.replace(`/more?error=${encodeURIComponent(reason)}`)
	}
	if (!await loadProfile({ force: true })) return router.replace('/more?error=profile_failed')
	router.replace(return_path)
})
</script>

<template>
	<LoadingOverlay text="登入中…" />
</template>
