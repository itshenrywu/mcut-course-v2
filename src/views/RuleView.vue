<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ChevronDown, ChevronsDownUp, ChevronsUpDown, Clock, Copy, FileDown, Info, Mail, Phone, Users } from '@lucide/vue'
import { findRule, findDept, ruleRoutePath, splitRuleName, sortRuleCourses, useRuleList, useRuleDetail, useEnrollCourses, DEFAULT_ID } from '@/lib/rule'
import { formatCourseTimes, formatDeptClass, hasRemark } from '@/lib/course'
import { formatTermLabel } from '@/lib/term'
import { useEnrollTime } from '@/lib/enroll-time'
import { useLocalRef } from '@/lib/storage'
import { schoolTel } from '@/lib/utils'
import { rulePageMeta } from '@/config/page-meta'
import { setPageMeta } from '@/lib/meta'
import { sendPageView } from '@/lib/analytics'
import LoadingOverlay from '@/components/LoadingOverlay.vue'
import LoadError from '@/components/LoadError.vue'
import RuleFilter from '@/components/RuleFilter.vue'
import FilterSidebar from '@/components/FilterSidebar.vue'
import FilterSummary from '@/components/FilterSummary.vue'
import RuleCategoryList from '@/components/RuleCategoryList.vue'
import SectionCard from '@/components/SectionCard.vue'
import SponsorAd from '@/components/SponsorAd.vue'
import RemarkText from '@/components/RemarkText.vue'
import CourseRow from '@/components/CourseRow.vue'
import EnrollBadge from '@/components/EnrollBadge.vue'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import CourseListDialog from '@/components/CourseListDialog.vue'
import { toast } from '@/components/ui/sonner'

// 入學系所名稱包含這些文字時, 不顯示須任選學分學程的說明
const NO_PROGRAM_DEPT_KEYWORDS = ['博士', '碩士', '在職專班', '國際學生專班', '菁英班', '學位學程', '能源電池科技專班', '雙聯學士專班', '外國學生專班']

const SECTION_CLASS = 'gap-0'
const TITLE_CLASS = 'px-4 py-2 lg:px-0'
const CARD_CLASS = 'mx-0 rounded-none md:rounded-none md:border-x-0 lg:rounded-lg lg:border-x overflow-hidden'

const route = useRoute()
const router = useRouter()

const sidebar_open = ref(false)

const open_subs = ref([])

const open_guide_subs = ref([])

const from_route = Boolean(route.params.year)

const selected_year = useLocalRef('mcv2-rule-year', '', from_route ? route.params.year : undefined)
const selected_dept = useLocalRef('mcv2-rule-dept', DEFAULT_ID, from_route ? route.params.dept_id || DEFAULT_ID : undefined)
const selected_rule_id = useLocalRef('mcv2-rule-id', '', from_route ? route.params.rule_id || '' : undefined)
const selected_enroll_term_id = useLocalRef('mcv2-rule-enroll-term')
const selected_sort_mode = useLocalRef('mcv2-rule-sort', 'grade')

const count_dialog_open = ref(false)
const count_dialog_course = ref(null)

const { rule_map, dept_map, loading, load_error, loadRuleList } = useRuleList()
const { enroll_term_list, loadEnrollTime } = useEnrollTime()

onMounted(() => {
	if (!enroll_term_list.value.length) loadEnrollTime()
	window.addEventListener('beforeprint', openAllSubs)
})

onUnmounted(() => {
	window.removeEventListener('beforeprint', openAllSubs)
})
const { detail, loading: detail_loading, load_error: detail_load_error, loadRuleDetail } = useRuleDetail()

const selected_rule = computed(() => findRule(rule_map.value, dept_map.value, selected_year.value, selected_dept.value, selected_rule_id.value))

const cross_program = computed(() => selected_rule.value?.type === '跨領域')

const enroll_course_term_id = computed(() => detail.value ? selected_enroll_term_id.value : '')

const { course_map } = useEnrollCourses(enroll_course_term_id)

const selected_dept_name = computed(() => findDept(dept_map.value, selected_year.value, selected_dept.value)?.name || '')

const has_dept = computed(() => Boolean(selected_dept_name.value))

const show_program_hint = computed(() => !NO_PROGRAM_DEPT_KEYWORDS.some(keyword => selected_dept_name.value.includes(keyword)))

const filter_summary = computed(() => {
	const info = []
	if (selected_year.value) info.push(`${selected_year.value} 學年入學`)
	if (selected_rule.value) info.push(selected_rule.value.name + (['跨領域', '第二專長'].includes(selected_rule.value.type) ? selected_rule.value.type : '入學課程總表'))
	else if (selected_dept_name.value) info.push(selected_dept_name.value)
	return info
})

function toCategories(list, sort_mode) {
	return (list || []).map(category => ({
		...category,
		...splitRuleName(category.name),
		category_list: (category.category_list || []).map(sub => ({
			...sub,
			...splitRuleName(sub.name),
			course_list: sortRuleCourses(sub.course_list, sort_mode)
		}))
	}))
}

function openAll(list) {
	return list.map(category => (category.category_list || []).map((_, index) => String(index)))
}

const categories = computed(() => toCategories(detail.value?.rule, selected_sort_mode.value))

const guide_categories = computed(() => toCategories(detail.value?.guide, selected_sort_mode.value)
	.map(category => ({ ...category, display_name: `修課指引 － ${category.display_name}` })))

const contact = computed(() => {
	const [dept_name, staff_name, ext, email] = (detail.value?.contact || []).map(value => (value || '').trim())
	if (!dept_name && !staff_name && !ext && !email) return null
	const tel = schoolTel(ext)
	return {
		name: [dept_name, staff_name].filter(Boolean).join(' '),
		phone_href: tel.href,
		phone_text: tel.text,
		email
	}
})

const documents = computed(() => (detail.value?.document || [])
	.map(item => ({ title: (item.title || '').trim(), url: (item.url || '').trim() }))
	.filter(item => item.url))

async function copyText(text, label) {
	try {
		await navigator.clipboard.writeText(text)
		toast.success(`已複製${label}`)
	} catch {
		toast.error(`${label}複製失敗`)
	}
}

const remarks = computed(() => (detail.value?.remark || [])
	.map(text => (text || '').trim())
	.filter(text => text && text.length >= 10))

const open_sub_opened = computed(() => {
	const category_list = [...categories.value, ...guide_categories.value]
	const opened_list = [...open_subs.value, ...open_guide_subs.value]
	return category_list.every((category, index) => !(category.category_list || []).length || opened_list[index]?.length)
})

const show_detail = computed(() => Boolean(detail.value) && !detail_load_error.value)

const show_empty_hint = computed(() => !loading.value && !load_error.value && !detail_loading.value && !detail_load_error.value && !detail.value)

function openAllSubs() {
	open_subs.value = openAll(categories.value)
	open_guide_subs.value = openAll(guide_categories.value)
}

function toggleAllSubs() {
	if (!open_sub_opened.value) {
		openAllSubs()
		return
	}
	open_subs.value = categories.value.map(() => [])
	open_guide_subs.value = guide_categories.value.map(() => [])
}

function openCount({ course, courses }) {
	count_dialog_course.value = { ...course, course_info: courses }
	count_dialog_open.value = true
}

function reloadRuleDetail() {
	loadRuleDetail(selected_year.value, selected_dept.value, selected_rule_id.value, { force: true })
}

watch([selected_year, selected_dept, selected_rule_id], ([year, dept, rule_id]) => {
	const path = ruleRoutePath(year, dept, rule_id)
	if (path !== route.path) router.replace(path)
	loadRuleDetail(year, dept, rule_id)
}, { immediate: true })

watch([selected_year, selected_rule], ([year, rule]) => {
	setPageMeta(rulePageMeta(year, rule?.name))
	sendPageView(route.fullPath)
}, { immediate: true })

watch(detail, value => {
	open_subs.value = (value?.rule || []).map(() => [])
	open_guide_subs.value = (value?.guide || []).map(() => [])
})

watch(() => route.path, () => {
	if (route.name !== 'rule' || !route.params.year) return
	selected_year.value = route.params.year
	selected_dept.value = route.params.dept_id || DEFAULT_ID
	selected_rule_id.value = route.params.rule_id || ''
})
</script>

<template>
	<LoadingOverlay v-if="loading || detail_loading" text="課程總表讀取中…" />
	<LoadError v-else-if="load_error" title="課程總表讀取失敗" @retry="loadRuleList({ force: true })" />
	<LoadError v-else-if="detail_load_error" title="課程總表讀取失敗" @retry="reloadRuleDetail" />

	<div class="flex w-full flex-1 flex-col">
		<div class="mx-auto flex w-full max-w-7xl flex-1 lg:px-4">
			<FilterSidebar v-model:open="sidebar_open">
				<RuleFilter
					v-model:year="selected_year"
					v-model:dept="selected_dept"
					v-model:rule-id="selected_rule_id"
					v-model:enroll-term-id="selected_enroll_term_id"
					v-model:sort-mode="selected_sort_mode"
					:rule-map="rule_map"
					:dept-map="dept_map"
					:enroll-term-list="enroll_term_list"
					:disabled="loading"
				/>
			</FilterSidebar>

			<div class="min-w-0 w-full flex-1 flex flex-col lg:pl-6">
				<div
					class="bg-color-2/90 sticky top-[var(--nav-h)] z-30 flex items-center gap-2 px-4 py-0.5 lg:pt-2 lg:px-0"
					:class="show_detail ? '' : 'lg:hidden'"
				>
					<button
						class="-ml-3 flex min-w-0 flex-1 items-center justify-start gap-2 rounded-md px-3 py-2 text-sm font-medium lg:hidden"
						@click="sidebar_open = true"
					>
						<span class="min-w-0 text-left">
							<FilterSummary :parts="filter_summary" fallback="篩選" />
						</span>
						<ChevronDown class="text-color-6 size-4 shrink-0 print:hidden" />
					</button>

					<div class="hidden lg:flex font-medium text-sm gap-1" v-if="selected_rule">
						<FilterSummary :parts="filter_summary" separator-class="text-color-6" />
					</div>

					<button
						v-if="show_detail"
						class="text-color-6 hover:text-color-8 ml-auto flex shrink-0 items-center gap-1 rounded-md pl-3 py-2 text-sm print:hidden"
						@click="toggleAllSubs"
					>
						<component :is="open_sub_opened ? ChevronsDownUp : ChevronsUpDown" class="size-4" />
						{{ open_sub_opened ? '全部收合' : '全部展開' }}
					</button>
				</div>

				<div class="flex min-h-0 flex-1 flex-col px-0">
					<div v-if="show_detail" class="flex flex-col gap-4 mb-4">
						<SectionCard title="說明" :section-class="SECTION_CLASS" :title-class="TITLE_CLASS" :card-class="CARD_CLASS">
							<ul class="marker:text-color-5 flex list-disc flex-col gap-1 p-4 pl-9 text-sm">
								<template v-if="has_dept">
									<li v-if="show_program_hint">須修畢<b class="font-medium">入學課程總表</b>，並須<b class="font-medium">任選一個學分學程</b>（跨領域或第二專長）才能畢業。</li>
									<li v-else>須修畢<b class="font-medium">入學課程總表</b>才能畢業。</li>
								</template>
								<li>點擊各分類即可展開該分類課程。</li>
								<li>欲選課前切換<b class="font-medium">欲選課學期</b>，即可查看該學期是否有開課。</li>
								<li><b class="font-medium">此頁面僅提供畢業學分門檻，其他畢業門檻（如路跑、游泳、英文、專業證照等）請見學校及系所規定。</b></li>
								<li v-if="cross_program">
									<Badge class="relative -top-px border-transparent bg-blue-500 px-1.5 py-0 align-middle text-[10px] leading-4 text-white">外系</Badge>
									標示表示<b class="font-medium">非入學系所</b>的課程。此標示僅供參考，實際依照開課為準。
								</li>
							</ul>
						</SectionCard>

						<RuleCategoryList
							v-model:open="open_subs"
							:categories="categories"
							:course-map="course_map"
							:cross-program="cross_program"
							:dept-id="selected_dept"
							@count-click="openCount"
						/>

						<SponsorAd :section-class="SECTION_CLASS" :title-class="TITLE_CLASS" :card-class="`${CARD_CLASS} lg:border-x-3`" />

						<RuleCategoryList
							v-model:open="open_guide_subs"
							:categories="guide_categories"
							:course-map="course_map"
							:cross-program="cross_program"
							:dept-id="selected_dept"
							@count-click="openCount"
						/>

						<SectionCard v-if="remarks.length" title="備註" :section-class="SECTION_CLASS" :title-class="TITLE_CLASS" :card-class="`${CARD_CLASS} flex flex-col gap-3 p-4 text-sm`">
							<RemarkText v-for="(text, index) in remarks" :key="index" :text="text" />
						</SectionCard>

						<SectionCard v-if="contact" title="承辦人" :section-class="SECTION_CLASS" :title-class="TITLE_CLASS" :card-class="`${CARD_CLASS} flex flex-col gap-3 p-4 text-sm`">
							<p v-if="contact.name" class="break-words">{{ contact.name }}</p>
							<div class="flex flex-wrap gap-2">
								<div class="flex max-w-full">
									<Button as="a" variant="outline" size="sm" class="min-w-0 rounded-r-none" :href="contact.phone_href">
										<Phone />
										<span class="truncate">{{ contact.phone_text }}</span>
									</Button>
									<Button variant="outline" size="sm" class="-ml-px rounded-l-none px-2" aria-label="複製電話" @click="copyText(contact.phone_text, '電話')">
										<Copy />
									</Button>
								</div>
								<div v-if="contact.email" class="flex max-w-full">
									<Button as="a" variant="outline" size="sm" class="min-w-0 rounded-r-none" :href="`mailto:${contact.email}`">
										<Mail />
										<span class="truncate">{{ contact.email }}</span>
									</Button>
									<Button variant="outline" size="sm" class="-ml-px rounded-l-none px-2" aria-label="複製 E-mail" @click="copyText(contact.email, ' E-mail')">
										<Copy />
									</Button>
								</div>
							</div>
						</SectionCard>

						<SectionCard v-if="documents.length" title="檔案下載" :section-class="SECTION_CLASS" :title-class="TITLE_CLASS" :card-class="`${CARD_CLASS} flex flex-wrap gap-2 p-4 text-sm`">
							<Button
								v-for="(item, index) in documents"
								:key="index"
								as="a"
								variant="outline"
								size="sm"
								class="min-w-0"
								:href="item.url"
								target="_blank"
								rel="noopener noreferrer"
							>
								<FileDown />
								<span class="truncate">{{ item.title || '下載檔案' }}</span>
							</Button>
						</SectionCard>
					</div>

					<p v-else-if="show_empty_hint" class="text-color-6 m-auto text-center text-sm">請選擇入學系所或學分學程</p>
				</div>
			</div>
		</div>

		<CourseListDialog v-if="count_dialog_course" v-model:open="count_dialog_open" :title="count_dialog_course.name" :count="count_dialog_course.course_info.length">
			<template #description>
				<span>{{ formatTermLabel(selected_enroll_term_id) }}</span>
				<span>{{ count_dialog_course.credit }} 學分</span>
			</template>
			<CourseRow
				v-for="course in count_dialog_course.course_info"
				:key="course.id"
				:course="course"
				target_blank
				@click="count_dialog_open = false"
			>
				<template #meta>
					<span class="flex items-center gap-1"><Users class="text-color-5 size-3.5 shrink-0" /> {{ formatDeptClass(course) }}</span>
					<EnrollBadge :type="course.enroll_type" />
					<span class="flex items-center gap-1">
						<Clock class="text-color-5 size-3.5 shrink-0" />
						{{ formatCourseTimes(course) }}
					</span>
					<span v-if="hasRemark(course)" class="flex w-full items-start gap-1">
						<Info class="text-color-5 mt-0.5 size-3.5 shrink-0" />
						<span class="min-w-0 flex-1 break-words">{{ course.remark }}</span>
					</span>
				</template>
			</CourseRow>
		</CourseListDialog>
	</div>
</template>
