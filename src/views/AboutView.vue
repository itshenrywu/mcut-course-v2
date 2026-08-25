<script setup>
import SourceDisclaimer from '@/components/SourceDisclaimer.vue'
import TextLink from '@/components/TextLink.vue'
import SectionCard from '@/components/SectionCard.vue'
import SponsorAd from '@/components/SponsorAd.vue'
import PageContainer from '@/components/PageContainer.vue'
</script>

<template>
	<PageContainer title="關於本站">
		<SectionCard card-class="p-4">
			<p class="text-sm leading-relaxed text-color-8">
				明志科技大學選課小幫手由 107 級工業工程與管理系畢業校友
				<TextLink href="https://henrywu.tw">Henry Wu</TextLink>
				開發製作，幫助您輕鬆查詢全校課表，快速進行課程預排與衝堂檢查，還可以查詢畢業學分門檻！
			</p>
		</SectionCard>

		<SectionCard title="資料來源及免責聲明" card-class="p-4">
			<SourceDisclaimer />
		</SectionCard>

		<SponsorAd />
	</PageContainer>
</template>
