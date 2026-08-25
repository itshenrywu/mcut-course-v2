<script setup>
import { onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AccountCard from '@/components/AccountCard.vue'
import LinkRow from '@/components/LinkRow.vue'
import PageContainer from '@/components/PageContainer.vue'
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
	<PageContainer title="更多功能" title-class="sr-only" container-class="py-0 md:py-8">
		<AccountCard />

		<SectionCard v-for="section in visible_sections" :key="section.title" :title="section.title" title-class="px-0" card-class="flex flex-col divide-y overflow-hidden">
			<LinkRow
				v-for="item in section.items"
				:key="item.to || item.href"
				:to="item.to"
				:href="item.href"
				:icon="item.icon"
				:label="item.label"
				:dot="hasItemUpdate(item)"
			/>
		</SectionCard>

		<SponsorAd />

		<div class="px-1 font-mono text-xs text-color-5">
			{{ build_time_text }}・<a :href="git_commit_url" target="_blank" rel="noopener noreferrer">{{ git_sha_short }}</a><template v-if="api_sha"> / {{ api_sha }}</template>
		</div>
	</PageContainer>
</template>
