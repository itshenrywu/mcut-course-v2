<script setup>
import { onMounted, watch } from 'vue'
import { ExternalLink } from '@lucide/vue'
import { useEnrollTime } from '@/lib/enroll-time'
import { useEmptyState } from '@/lib/loader'
import { formatTermLabel } from '@/lib/term'
import { cellClass, cellText, schoolTel } from '@/lib/utils'
import LoadingOverlay from '@/components/LoadingOverlay.vue'
import LoadError from '@/components/LoadError.vue'
import SectionCard from '@/components/SectionCard.vue'
import SponsorAd from '@/components/SponsorAd.vue'
import PageContainer from '@/components/PageContainer.vue'
import InfoTable from '@/components/InfoTable.vue'
import EmptyHint from '@/components/EmptyHint.vue'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

const ENROLL_TIME_TABLE_HEADERS = ['學制 / 年級', '選課學期', '網路初選', '網路加退選', '學分下限', '學分上限']

const { enroll_list, loading, loaded, load_error, loadEnrollTime, markEnrollTimeSeen } = useEnrollTime()

onMounted(() => {
	if (!enroll_list.value.length) loadEnrollTime()
})

const show_empty_hint = useEmptyState(enroll_list, { loading, loaded, load_error })

watch(enroll_list, markEnrollTimeSeen, { immediate: true })
</script>

<template>
	<LoadingOverlay v-if="loading" text="選課時間讀取中…" />
	<LoadError v-else-if="load_error" title="選課時間讀取失敗" @retry="loadEnrollTime({ force: true })" />

	<PageContainer title="選課時間及說明" container-class="max-w-5xl">
		<template #title-extra>
			<Button as="a" size="sm" variant="outline" href="http://day.course.mcut.edu.tw/?openExternalBrowser=1" target="_blank" rel="nofollow noopener noreferrer">
				前往選課系統
				<ExternalLink />
			</Button>
		</template>

		<SectionCard v-if="enroll_list.length" title="選課時間" :card="false">
			<!-- PC -->
			<div class="bg-color-1 hidden overflow-hidden border md:block md:rounded-lg">
				<InfoTable :headers="ENROLL_TIME_TABLE_HEADERS" header-class="whitespace-nowrap">
					<tr v-for="item in enroll_list" :key="item.name">
						<td class="px-3 py-2.5 font-medium whitespace-nowrap">{{ item.name }}</td>
						<template v-if="item.announced">
							<td class="text-color-8 px-3 py-2.5 whitespace-nowrap">{{ formatTermLabel(item.term_id) }}</td>
							<td class="px-3 py-2.5" :class="cellClass(item.first_enroll)">{{ cellText(item.first_enroll) }}</td>
							<td class="px-3 py-2.5" :class="cellClass(item.add_drop)">{{ cellText(item.add_drop) }}</td>
						</template>
						<td v-else class="text-color-5 px-3 py-2.5" colspan="3">選課時間尚未公布</td>
						<td class="px-3 py-2.5 whitespace-nowrap" :class="cellClass(item.credit_min)">{{ cellText(item.credit_min) }}</td>
						<td class="px-3 py-2.5 whitespace-nowrap" :class="cellClass(item.credit_max)">{{ cellText(item.credit_max) }}</td>
					</tr>
				</InfoTable>
			</div>

			<!-- Mobile -->
			<div class="bg-color-1 -mx-4 flex flex-col divide-y border border-x-0 md:hidden">
				<article v-for="item in enroll_list" :key="item.name" class="flex flex-col gap-2 px-4 py-3">
					<div class="flex items-center justify-between gap-2">
						<span class="font-medium">{{ item.name }}</span>
						<Badge v-if="item.announced && item.term_id" variant="secondary">{{ formatTermLabel(item.term_id) }}</Badge>
					</div>
					<p v-if="!item.announced" class="text-color-5 text-sm">選課時間尚未公布</p>
					<dl v-else class="grid grid-cols-[4.5rem_1fr] gap-x-3 gap-y-1 text-sm">
						<dt class="text-color-6">網路初選</dt>
						<dd :class="cellClass(item.first_enroll)">{{ cellText(item.first_enroll) }}</dd>
						<dt class="text-color-6">網路加退選</dt>
						<dd :class="cellClass(item.add_drop)">{{ cellText(item.add_drop) }}</dd>
					</dl>
					<div v-if="item.credit_min || item.credit_max" class="text-color-6 flex flex-wrap gap-x-4 text-xs">
						<span>學分下限 <span :class="cellClass(item.credit_min)">{{ cellText(item.credit_min) }}</span></span>
						<span>學分上限 <span :class="cellClass(item.credit_max)">{{ cellText(item.credit_max) }}</span></span>
					</div>
				</article>
			</div>
		</SectionCard>

		<EmptyHint v-else-if="show_empty_hint">目前沒有選課時間資料，請稍後或改天再試</EmptyHint>

		<SectionCard title="說明" card-class="py-4 pr-4 pl-9">
			<ol class="text-color-8 marker:text-color-5 list-outside list-decimal space-y-1 text-sm leading-relaxed marker:tabular-nums">
				<li>四技部必修課程已由系統自動預選，選修課程（如四技通識、專業課程等）須自行選課，外系課程加退選期間才能選課。</li>
				<li>選課學分數須介於上下限之間。</li>
				<li>通識課程每學期限制最多選修兩門。</li>
				<li>選課完成後，記得要在選課系統的<span class="font-medium">選課確認</span>中檢查是否都有選到。</li>
				<li>
					若無登入過校園入口網，選課密碼預設為身分證字號（大寫）。若忘記密碼請洽電算中心
					<a class="text-color-10 underline underline-offset-2" :href="schoolTel('2263').href">2908-9899#2263</a>。
				</li>
				<li>
					選課問題請洽教務處課務組
					<span class="inline-flex gap-x-1">
						<a class="text-color-10 underline underline-offset-2" :href="schoolTel('2207').href">2908-9899#2207</a>
						<a class="text-color-10 underline underline-offset-2" :href="schoolTel('2208').href">#2208</a>
						<a class="text-color-10 underline underline-offset-2" :href="schoolTel('2209').href">#2209</a>
					</span>。
				</li>
			</ol>
		</SectionCard>

		<SponsorAd />
	</PageContainer>
</template>
