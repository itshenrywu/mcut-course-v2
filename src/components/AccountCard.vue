<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { CircleUserRound, LogIn, LogOut } from '@lucide/vue'
import { Button } from '@/components/ui/button'
import ConfirmDialog from '@/components/ConfirmDialog.vue'
import InlineLoading from '@/components/InlineLoading.vue'
import UserAvatar from '@/components/UserAvatar.vue'
import { useAuth } from '@/lib/auth'

const route = useRoute()
const { profile, loading, load_error, is_logged_in, profile_image_url, loginWithLine, loadProfile, logout } = useAuth()

const logout_open = ref(false)

onMounted(() => {
	loadProfile()
})

function onLogin() {
	loginWithLine(route.fullPath)
}

async function onLogout() {
	await logout()
	window.location.reload()
}
</script>

<template>
	<section class="flex flex-col gap-2">
		<div class="bg-color-1 flex items-center gap-3 border border-x-0 px-4 py-3 -mx-4 md:mx-0 md:rounded-lg md:border-x">
			<template v-if="is_logged_in">
				<UserAvatar :src="profile_image_url" />
				<div class="flex min-w-0 flex-col">
					<InlineLoading v-if="loading" size="size-3.5" container-class="justify-start gap-1.5" />
					<span v-else-if="load_error" class="text-color-6 text-sm">資料讀取失敗</span>
					<template v-else>
						<span class="truncate text-sm font-medium">{{ profile?.name }}</span>
					</template>
				</div>
				<Button variant="outline" size="sm" class="ml-auto shrink-0" @click="logout_open = true">
					登出
					<LogOut />
				</Button>
			</template>
			<template v-else>
				<CircleUserRound class="text-color-6 size-10 shrink-0" />
				<div class="flex min-w-0 flex-col">
					<span class="text-sm font-medium">尚未登入</span>
					<span class="text-color-6 text-xs">登入後可跨裝置同步收藏的課程及我的課表</span>
				</div>
				<Button variant="outline" size="sm" class="ml-auto shrink-0" @click="onLogin()">
					<LogIn />
					登入
				</Button>
			</template>
		</div>

		<ConfirmDialog
			v-model:open="logout_open"
			title="確定要登出嗎？"
			description="登出後也將清除所有設定與收藏的課程"
			confirm-text="登出"
			@confirm="onLogout()"
		/>
	</section>
</template>
