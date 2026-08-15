<script setup>
import { computed } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { School, Star, CircleUserRound, GraduationCap, TextAlignStart } from '@lucide/vue'
import { cn } from '@/lib/utils'
import { useFavorite } from '@/lib/favorite'
import { useSelectedTerm } from '@/lib/term'
import { useMoreMenu } from '@/lib/more-menu'
import { useAuth } from '@/lib/auth'
import { Badge } from '@/components/ui/badge'
import UserAvatar from '@/components/UserAvatar.vue'

const menu_items = [
	{ to: '/', label: '全校課程', icon: School, active_paths: ['/', '/course'] },
	{ to: '/favorite', label: '收藏的課程', icon: Star },
	{ to: '/my', label: '我的課表', icon: CircleUserRound },
	{ to: '/rule', label: '畢業學分門檻', icon: GraduationCap },
	{ to: '/more', label: '更多功能', icon: TextAlignStart }
]

const route = useRoute()

const { favorite_ids } = useFavorite()
const { selected_term_id, isTermCourseId } = useSelectedTerm()
const { is_logged_in, profile_image_url } = useAuth()
const { has_update: more_update } = useMoreMenu()
const favorite_count = computed(() => {
	if (!selected_term_id.value) return 0
	let count = 0
	for (const id of favorite_ids.value) {
		if (isTermCourseId(id)) count++
	}
	return count
})

function isItemActive(item) {
	if (!route.matched.length) return false
	const active_paths = item.active_paths || [item.to]
	return active_paths.some(path => route.path === path || (path !== '/' && route.path.startsWith(`${path}/`)))
}
</script>

<template>
	<header class="border-b bg-color-1">
		<nav class="mx-auto flex h-12 max-w-4xl items-center sm:justify-center sm:px-4">
			<RouterLink
				v-for="item in menu_items"
				:key="item.to"
				:to="item.to"
				custom
				v-slot="{ navigate, href }"
			>
				<a
					:href="href"
					:class="cn('flex h-full flex-1 flex-col items-center justify-center gap-1 border-b-2 text-xs sm:flex-none sm:flex-row sm:gap-1.5 sm:px-4 sm:text-sm', isItemActive(item) ? 'border-color-10 text-color-10' : 'border-transparent text-color-7 hover:text-color-10')"
					@click="navigate"
				>
					<span class="relative">
						<UserAvatar
							v-if="item.to === '/more' && is_logged_in"
							:src="profile_image_url"
							size="size-5"
						/>
						<component v-else :is="item.icon" class="size-5" />
						<Badge
							v-if="item.to === '/favorite' && favorite_count"
							class="absolute -bottom-1.5 -right-2.5 h-4 min-w-4 border-0 bg-amber-500 px-1 text-white sm:hidden text-[9px]"
						>{{ favorite_count }}</Badge>
						<span
							v-if="item.to === '/more' && more_update"
							class="absolute -bottom-0.5 -right-1.5 size-2 rounded-full bg-red-500 sm:hidden"
						/>
					</span>
					<span class="relative text-[10px] xs:text-xs sm:text-sm">
						{{ item.label }}
						<span
							v-if="item.to === '/more' && more_update"
							class="absolute -right-3 -top-1 hidden size-2 rounded-full bg-red-500 sm:block"
						/>
					</span>
					<Badge
						v-if="item.to === '/favorite'"
						class="hidden h-4 min-w-6 px-2 border-0 bg-color-3 text-color-6 sm:inline-flex"
						:class="{ 'bg-amber-500 text-white': favorite_count > 0 }"
					>{{ favorite_count }}</Badge>
				</a>
			</RouterLink>
		</nav>
	</header>
</template>
