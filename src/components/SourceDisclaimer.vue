<script setup>
import { ExternalLink } from '@lucide/vue'

const SOURCE_LINKS = [
	{ name: '年度開課資料查詢系統', url: 'https://info.mcut.edu.tw/web1/std_datasearch/stda_course_search.aspx' },
	{ name: '入學課程總表查詢系統', url: 'http://academic.mcut.edu.tw/AAS/frontshow/LinkCourseMasterList.aspx?View=CML' },
	{ name: '學生網路選課系統', url: 'http://day.course.mcut.edu.tw/' },
	{ name: '教務處', url: 'https://aca.mcut.edu.tw/?Lang=zh-tw' },
	{ name: '通識教育中心', url: 'https://ge.mcut.edu.tw/' },
	{ name: '語言中心', url: 'https://lc.mcut.edu.tw/' }
]

const props = defineProps({
	showHeading: {
		type: Boolean,
		default: true
	}
})
</script>

<template>
	<section class="flex flex-col gap-3">
		<h2 v-if="props.showHeading" class="text-xl font-bold tracking-tight">資料來源及免責聲明</h2>
		<p class="text-color-8 text-sm leading-relaxed">本站資料來源</p>
		<ul class="text-color-8 marker:text-color-5 flex list-disc flex-col gap-1 pl-5 text-sm">
			<li v-for="item in SOURCE_LINKS" :key="item.url">
				<a class="text-color-10 inline-flex items-center gap-1 underline underline-offset-2" :href="item.url" target="_blank" rel="nofollow noopener noreferrer">
					{{ item.name }}
					<ExternalLink class="size-3.5 shrink-0" />
				</a>
			</li>
		</ul>
		<p class="text-color-8 text-sm leading-relaxed">資料可能會有同步延遲或缺漏，內容僅供參考，實際請以學校公告為準。如因資料錯誤導致任何損失，本站概不負責。</p>
	</section>
</template>
