<script setup>
import { onMounted } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { ExternalLink, ChevronRight } from '@lucide/vue'
import AccountCard from '@/components/AccountCard.vue'
import SectionCard from '@/components/SectionCard.vue'
import SponsorAd from '@/components/SponsorAd.vue'
import { toast } from '@/components/ui/sonner'
import { useMoreMenu } from '@/lib/more-menu'
import { api_sha } from '@/lib/pre'
import { formatDateTime } from '@/lib/utils'

const git_sha_short = __GIT_SHA__.slice(0, 8)
const git_commit_url = `https://github.com/itshenrywu/mcut-course-v2/commit/${__GIT_SHA__}`
const build_time_text = formatDateTime(__BUILD_TIME__, 'YYYYMMDDHHmmss')

const route = useRoute()
const router = useRouter()

const { visible_sections, hasItemUpdate } = useMoreMenu()

onMounted(() => {
	const error = route.query.error
	if (!error) return
	toast.error('登入失敗，請再試一次', { description: `#${error}` })
	router.replace('/more')
})
</script>

<template>
	<div class="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-4 md:py-8">
		<AccountCard />

		<SectionCard v-for="section in visible_sections" :key="section.title" :title="section.title" title-class="px-0" card-class="flex flex-col divide-y overflow-hidden">
			<template v-for="item in section.items">
				<RouterLink v-if="item.to" :key="item.to" :to="item.to" class="flex items-center gap-3 px-4 py-3 text-sm hover:bg-color-2">
					<component :is="item.icon" class="text-color-6 size-4 shrink-0" />
					{{ item.label }}
					<span v-if="hasItemUpdate(item)" class="size-2 shrink-0 rounded-full bg-red-500" />
					<ChevronRight class="text-color-5 ml-auto size-4 shrink-0" />
				</RouterLink>
				<a v-else :key="item.href" :href="item.href" target="_blank" rel="noopener noreferrer" class="flex items-center gap-3 px-4 py-3 text-sm hover:bg-color-2">
					<component :is="item.icon" class="text-color-6 size-4 shrink-0" />
					{{ item.label }}
					<ExternalLink class="text-color-5 ml-auto size-4 shrink-0" />
				</a>
			</template>
		</SectionCard>

		<SponsorAd />

		<div class="text-color-5 px-1 font-mono text-xs">
			{{ build_time_text }}・<a :href="git_commit_url" target="_blank" rel="noopener noreferrer">{{ git_sha_short }}</a><template v-if="api_sha"> / {{ api_sha }}</template>
		</div>
	</div>
</template>
