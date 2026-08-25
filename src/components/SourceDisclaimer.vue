<script setup>
import { ExternalLink } from '@lucide/vue'
import HintList from '@/components/HintList.vue'
import TextLink from '@/components/TextLink.vue'

const SOURCE_LINKS = [
	{ name: '年度開課資料查詢系統', url: 'https://info.mcut.edu.tw/web1/std_datasearch/stda_course_search.aspx' },
	{ name: '入學課程總表查詢系統', url: 'http://academic.mcut.edu.tw/AAS/frontshow/LinkCourseMasterList.aspx?View=CML' },
	{ name: '學生網路選課系統', url: 'http://day.course.mcut.edu.tw/' },
	{ name: '教務處', url: 'https://aca.mcut.edu.tw/?Lang=zh-tw' },
	{ name: '通識教育中心', url: 'https://ge.mcut.edu.tw/' },
	{ name: '語言中心', url: 'https://lc.mcut.edu.tw/' }
]
</script>

<template>
	<section class="flex flex-col gap-3">
		<p class="text-sm leading-relaxed text-color-8">本站資料來源</p>
		<HintList>
			<li v-for="item in SOURCE_LINKS" :key="item.url">
				<TextLink :href="item.url" nofollow class="inline-flex items-center gap-1">
					{{ item.name }}
					<ExternalLink class="size-3.5 shrink-0" />
				</TextLink>
			</li>
		</HintList>
		<p class="text-sm leading-relaxed text-color-8">資料可能會有同步延遲或缺漏，內容僅供參考，實際請以學校公告為準。如因資料錯誤導致任何損失，本站概不負責。</p>
	</section>
</template>
