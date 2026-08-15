<script setup>
import { computed, onMounted } from 'vue'
import { SearchX } from '@lucide/vue'
import { usePassportInfo, passportTotalRows, passportRecordRows } from '@/lib/passport'
import { useUidSearch } from '@/lib/uid'
import LoadError from '@/components/LoadError.vue'
import PageContainer from '@/components/PageContainer.vue'
import SectionCard from '@/components/SectionCard.vue'
import SponsorAd from '@/components/SponsorAd.vue'
import StateBlock from '@/components/StateBlock.vue'
import EmptyHint from '@/components/EmptyHint.vue'
import UidSearchForm from '@/components/UidSearchForm.vue'

const { passport_item, total_points, searched_uid, loading, load_error, loadPassport, markPassportSeen } = usePassportInfo()

const { uid_input, format_error, search, retry } = useUidSearch({
	searched_uid,
	load: loadPassport
})

const total_rows = computed(() => passportTotalRows(passport_item.value))

const record_rows = computed(() => passportRecordRows(passport_item.value))

const show_not_found = computed(() => Boolean(searched_uid.value) && !passport_item.value)

onMounted(() => {
	markPassportSeen()
})
</script>

<template>
	<LoadError v-if="load_error" title="英語學習護照讀取失敗" @retry="retry()" />

	<PageContainer title="英語學習護照點數查詢" container-class="gap-6">
		<UidSearchForm
			v-model="uid_input"
			input-id="passport-uid"
			:loading="loading"
			:format-error="format_error"
			@search="search()"
		/>

		<template v-if="passport_item">
			<SectionCard title="統計" card-class="overflow-hidden">
				<div class="flex items-baseline justify-between gap-4 border-b px-4 py-3">
					<span class="text-sm font-medium">總計點數</span>
					<span class="font-num shrink-0 text-lg font-bold tabular-nums">{{ total_points }}</span>
				</div>
				<ul class="flex flex-col divide-y">
					<li
						v-for="row in total_rows"
						:key="row.name"
						class="flex items-baseline justify-between gap-4 px-4 py-2.5 text-sm"
					>
						<span class="min-w-0">
							{{ row.name }}
							<span v-if="row.note" class="text-color-6 text-xs">{{ row.note }}</span>
						</span>
						<span
							class="font-num shrink-0 tabular-nums"
							:class="row.points ? 'font-medium' : 'text-color-5'"
						>{{ row.points }}</span>
					</li>
				</ul>
			</SectionCard>

			<SponsorAd />

			<SectionCard title="明細" card-class="overflow-hidden">
				<ul v-if="record_rows.length" class="flex flex-col divide-y">
					<li v-for="(row, index) in record_rows" :key="index" class="flex flex-col gap-1.5 px-4 py-3">
						<div class="flex items-baseline justify-between gap-4">
							<span class="min-w-0 text-sm font-medium">{{ row.name }}</span>
							<span class="font-num shrink-0 text-sm font-medium tabular-nums">{{ row.points }} 點</span>
						</div>
						<dl class="text-color-8 flex flex-wrap gap-x-4 gap-y-1 text-xs">
							<div class="flex gap-1">
								<dt class="text-color-6">日期</dt>
								<dd>{{ row.date }}</dd>
							</div>
							<div class="flex gap-1">
								<dt class="text-color-6">次數</dt>
								<dd class="font-num tabular-nums">{{ row.count }}</dd>
							</div>
							<div v-if="row.acknowledged" class="flex gap-1">
								<dt class="text-color-6">已確認</dt>
								<dd>{{ row.acknowledged }}</dd>
							</div>
							<div v-if="row.verified" class="flex gap-1">
								<dt class="text-color-6">核實</dt>
								<dd>{{ row.verified }}</dd>
							</div>
						</dl>
					</li>
				</ul>

				<EmptyHint v-else>目前沒有活動明細</EmptyHint>
			</SectionCard>
		</template>

		<StateBlock
			v-else-if="show_not_found"
			:icon="SearchX"
			:title="`查無 ${searched_uid} 的英語學習護照資料`"
			description="請確認學號是否正確"
			container-class="flex-1"
		/>
	</PageContainer>
</template>
