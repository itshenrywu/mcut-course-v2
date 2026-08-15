<script setup>
import { CHANGE_TYPE_CLASSES, CHANGE_TYPES, useChangelog } from '@/lib/changelog'
import LoadingOverlay from '@/components/LoadingOverlay.vue'
import SectionCard from '@/components/SectionCard.vue'
import SponsorAd from '@/components/SponsorAd.vue'
import PageContainer from '@/components/PageContainer.vue'
import LoadError from '@/components/LoadError.vue'
import { Badge } from '@/components/ui/badge'

const { year_groups, loading, load_error, loadChangelog } = useChangelog()
</script>

<template>
	<LoadingOverlay v-if="loading" text="更新紀錄讀取中…" />
	<LoadError v-else-if="load_error" title="更新紀錄讀取失敗" @retry="loadChangelog({ force: true })" />

	<PageContainer title="更新紀錄" container-class="px-0" title-class="px-4 md:px-0">
		<template v-for="(group, index) in year_groups" :key="group.year">
			<SectionCard :title="String(group.year)" title-class="px-4 md:px-0" card-class="mx-0 flex flex-col divide-y overflow-hidden">
				<article v-for="item in group.items" :key="item.key" class="flex flex-col gap-1.5 px-4 py-3 sm:flex-row sm:gap-4">
					<span class="text-color-6 shrink-0 pt-0.5 text-xs sm:w-10">{{ item.date }}</span>
					<div class="flex min-w-0 flex-col gap-1.5">
						<div v-if="CHANGE_TYPES[item.type]|| item.tag.length" class="flex flex-wrap items-center gap-1.5">
							<Badge v-if="CHANGE_TYPES[item.type]" variant="secondary" :class="['border-transparent', CHANGE_TYPE_CLASSES[item.type]]">
								{{ CHANGE_TYPES[item.type] }}
							</Badge>
							<Badge v-for="tag in item.tag" :key="tag" variant="secondary" class="border-transparent">
								{{ tag }}
							</Badge>
						</div>
						<p class="text-color-8 text-sm leading-relaxed">{{ item.description }}</p>
					</div>
				</article>
			</SectionCard>

			<SponsorAd v-if="index === 0" title-class="px-4 md:px-0" card-class="mx-0" />
		</template>
	</PageContainer>
</template>
