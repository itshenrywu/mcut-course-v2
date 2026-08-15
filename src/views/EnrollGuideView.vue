<script setup>
import { computed } from 'vue'
import { useGuide, splitGuideHtml } from '@/lib/guide'
import LoadingOverlay from '@/components/LoadingOverlay.vue'
import LoadError from '@/components/LoadError.vue'
import RichHtml from '@/components/RichHtml.vue'
import PageContainer from '@/components/PageContainer.vue'
import SponsorAd from '@/components/SponsorAd.vue'

// 廣告插在第幾個 <h2> 大段落之後 (由 1 起算, 超過段落數則放在最後)
const AD_AFTER_SECTION = 1

const { guide_html, loading, load_error, loadGuide } = useGuide()

const guide_parts = computed(() => splitGuideHtml(guide_html.value, AD_AFTER_SECTION))
</script>

<template>
	<LoadingOverlay v-if="loading" text="選課指南讀取中…" />
	<LoadError v-else-if="load_error" title="選課指南讀取失敗" @retry="loadGuide({ force: true })" />

	<PageContainer title="選課指南">
		<RichHtml :html="guide_parts[0]" />

		<SponsorAd v-if="guide_html" />

		<RichHtml v-if="guide_parts[1]" :html="guide_parts[1]" />
	</PageContainer>
</template>
