<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { Copy } from '@lucide/vue'
import { formatDateTime } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/sonner'
import PageContainer from '@/components/PageContainer.vue'
import SectionCard from '@/components/SectionCard.vue'
import LinkRow from '@/components/LinkRow.vue'
import SponsorAd from '@/components/SponsorAd.vue'
import GithubIcon from '@/components/icons/GithubIcon.vue'
import { api_sha } from '@/lib/pre'
import LineIcon from '@/components/icons/LineIcon.vue'
import InstagramIcon from '@/components/icons/InstagramIcon.vue'

const CONTACT_LIST = [
	{ href: 'https://line.me/ti/p/s4zExvVTlG', label: 'LINE', icon: LineIcon },
	{ href: 'https://www.instagram.com/itshenrywu/', label: 'Instagram', icon: InstagramIcon },
	{ href: 'https://github.com/itshenrywu/mcut-course-v2/issues', label: 'GitHub Issue (公開)', icon: GithubIcon },
]

const route = useRoute()

const debug_text = computed(() => {
	const { from, method, url, status, message, time, online } = route.query
	return [
		from && `Page: ${from}`,
		url && `Request: ${method || 'GET'} ${url}`,
		status && `Status: ${status}`,
		message && `Message: ${message}`,
		time && `Time: ${formatDateTime(Number(time), 'YYYY-MM-DD HH:mm:ss')}`,
		online && `Online: ${online !== 'false'}`,
		`Build: ${formatDateTime(__BUILD_TIME__, 'YYYYMMDDHHmmss')} (${__GIT_SHA__.slice(0, 8)})`,
		api_sha.value && `API: ${api_sha.value}`,
		`UserAgent: ${navigator.userAgent}`
	].filter(Boolean).join('\n')
})

async function copyDebugText() {
	try {
		await navigator.clipboard.writeText(debug_text.value)
		toast.success('已複製除錯資訊')
	} catch {
		toast.error('除錯資訊複製失敗')
	}
}
</script>

<template>
	<PageContainer title="建議及問題回報">
		<SectionCard card-class="p-4">
			<p class="text-sm leading-relaxed text-color-8">
				使用上遇到問題、發現資料錯誤，或是有任何功能建議，都歡迎透過以下方式回報。回報問題時，建議附上截圖與操作步驟，可以幫助我們更快找到原因！
			</p>
		</SectionCard>

		<SectionCard title="回報及聯繫方式" card-class="flex flex-col divide-y overflow-hidden">
			<LinkRow
				v-for="item in CONTACT_LIST"
				:key="item.href"
				:href="item.href"
				:icon="item.icon"
				:label="item.label"
			/>
		</SectionCard>

		<SectionCard title="除錯資訊" card-class="p-4">
			<p class="font-mono text-xs leading-relaxed break-all whitespace-pre-wrap text-color-8">{{ debug_text }}</p>
			<div class="mt-2 flex items-center justify-between gap-2">
				<p class="text-xs text-color-6">回報問題時請附上以上資訊</p>
				<Button variant="outline" size="sm" @click="copyDebugText">
					<Copy />
					複製
				</Button>
			</div>
		</SectionCard>

		<SponsorAd />
	</PageContainer>
</template>
