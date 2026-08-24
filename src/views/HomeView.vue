<script setup>
import { ref, computed } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { List, Dumbbell, BookOpen, Users, Globe, Leaf, Palette, ChevronRight } from '@lucide/vue'
import { isAltCourse, useCourseList, courseRoutePath, isClassScheduleDept, canShowMixedGrade, collectGradeInfo, formatDeptClass, courseMatchesKeyword, courseKeywordIndex, GRADE_LABELS } from '@/lib/course'
import { isSummerTerm, applyUrlTermId } from '@/lib/term'
import { useDebouncedRef } from '@/lib/utils'
import { useSearchHistory } from '@/lib/search-history'
import { useCrossTermSearch } from '@/lib/course-search'
import LoadingOverlay from '@/components/LoadingOverlay.vue'
import LoadError from '@/components/LoadError.vue'
import TermSelect from '@/components/TermSelect.vue'
import SearchHistory from '@/components/SearchHistory.vue'
import CrossTermResult from '@/components/CrossTermResult.vue'
import { Input } from '@/components/ui/input'
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion'
import { toast } from '@/components/ui/sonner'

// 科系簡稱(班級名稱)對應
const DEPT_SHORT_NAME_IN_CLASS = {
	'四技化工系': '化',
	'四技工管系': '管',
	'四技工設系': '設',
	'四技材工系': '材',
	'四技機械系': '機',
	'四技環安衛系': '環',
	'四技經管系': '經',
	'四技視傳系': '傳',
	'四技電子系': '子',
	'四技電機系': '電',
	'四技行設專班': '行設',
	'人工智慧學程': '工智',
	'半導體學程': '半導體',
	'行銷設計學程': '行設',
	'電池專班': '電池',
	'化工系生工碩士班': '碩生',
	'化工系碩士班': '碩化',
	'工管系碩士班': '碩管',
	'工管系碩專班': '碩專管',
	'工設系碩士班': '碩設',
	'材料系碩士班': '碩材',
	'機械系碩士班': '碩機',
	'環安衛系碩士班': '碩環',
	'經管系碩士班': '碩經',
	'視傳系碩士班': '碩傳',
	'電子系碩士班': '碩子',
	'電機系碩士班': '碩電',
	'國際企業管理碩士': '國企碩',
	'能源電池博士班': '博綠能',
	'電漿薄膜博士學程': '博電膜',
	'半導體碩士學程': '碩半導體',
	'行銷設計碩士學程': '碩行設',
	'生醫暨醫材博士學程': '博生醫'
}

const QUICK_BUTTONS = [{
		key: 'advanced',
		title: '進階搜尋',
		description: '依系所、班級、修別搜尋',
		icon: List,
		hot: true,
		span_full: true
	},
	{
		key: 'pe',
		title: '自選體育',
		description: '二上二下各須選一門，也可大四時修',
		icon: Dumbbell,
		lock: {
			kind: 'pe'
		}
	},
	{
		key: 'ge_practice',
		title: '永續發展與社會實踐',
		description: '/ 經典教育與社會實踐',
		icon: BookOpen,
		lock: {
			kind: 'ge_practice',
			categories: ['永續發展與社會實踐', '經典教育與社會實踐']
		}
	},
	{
		key: 'ge_social',
		title: '社會科學',
		description: '通識選修類型',
		icon: Users,
		lock: {
			kind: 'ge',
			categories: ['社會研究與未來趨勢', '社會科學']
		}
	},
	{
		key: 'ge_language',
		title: '語言與全球化',
		description: '通識選修類型',
		icon: Globe,
		lock: {
			kind: 'ge',
			categories: ['語言與全球化']
		}
	},
	{
		key: 'ge_nature',
		title: '自然科學',
		description: '通識選修類型',
		icon: Leaf,
		lock: {
			kind: 'ge',
			categories: ['自然科學與環境永續', '自然科學']
		}
	},
	{
		key: 'ge_humanity',
		title: '人文藝術',
		description: '通識選修類型',
		icon: Palette,
		lock: {
			kind: 'ge',
			categories: ['人文藝術']
		}
	}
]

// 最近點選的班級所屬系所, 只在載入時讀一次, 下次重新整理才影響排序
const recent_dept = localStorage.getItem('mcv2-recent-dept') || ''

const { selected_term_id, term_list, course_list, loading, load_error, loadCourseList } = useCourseList()

const route = useRoute()
const router = useRouter()
applyUrlTermId(route, router)
const keyword = ref('')
const debounced_keyword = useDebouncedRef(keyword)
const search_open = ref(false)
const { search_history, addSearchHistory } = useSearchHistory()

function rememberKeyword(value) {
	addSearchHistory(value ?? debounced_keyword.value)
}

const search_results = computed(() => {
	const kw = debounced_keyword.value.trim().toLowerCase()
	const courses = []
	const teacher_map = new Map()
	if (kw) {
		for (const course of course_list.value) {
			if (isAltCourse(course)) continue
			if (courseMatchesKeyword(course, kw, { teacher: false })) courses.push(course)
			if (courseKeywordIndex(course).teacher.includes(kw)) teacher_map.set(course.teacher, (teacher_map.get(course.teacher) || 0) + 1)
		}
	}
	return { courses, teachers: Array.from(teacher_map, ([name, count]) => ({ name, count })) }
})

const course_results = computed(() => search_results.value.courses)

const teacher_results = computed(() => search_results.value.teachers)

const visible_courses = computed(() => course_results.value.slice(0, 5))

const has_results = computed(() => course_results.value.length > 0 || teacher_results.value.length > 0)

const cross_term_enabled = computed(() =>
	search_open.value && !loading.value && !!debounced_keyword.value.trim() && !has_results.value
)

const { result: cross_term_result, loading: cross_term_loading } = useCrossTermSearch(debounced_keyword, cross_term_enabled)

function switchTermAndSearch(term_id) {
	selected_term_id.value = term_id
}

const course_index = computed(() => {
	const general_courses = []
	const general_type_map = new Map()
	const summer_depts = new Set()
	const dept_map = new Map()
	const grade_map = new Map()
	let has_pe = false
	for (const course of course_list.value) {
		const { dept, grade, class_group, general_type } = course
		if (dept === '體育組-四技(日)') has_pe = true
		if (dept?.includes('通識中心')) {
			general_courses.push(course)
			if (general_type && !general_type_map.has(general_type)) general_type_map.set(general_type, course)
		}
		if (isAltCourse(course)) continue
		if (!dept || !isClassScheduleDept(dept)) continue
		summer_depts.add(dept)
		if (grade == null || grade === '') continue
		collectGradeInfo(grade_map, `${dept}-${grade}`, course)
		if (!class_group || class_group === '重') continue
		let class_map = dept_map.get(dept)
		if (!class_map) {
			class_map = new Map()
			dept_map.set(dept, class_map)
		}
		const dept_grade_class = `${dept}-${grade}-${class_group}`
		if (!class_map.has(dept_grade_class)) class_map.set(dept_grade_class, { id: dept_grade_class, grade, class_group })
	}
	return {
		has_pe,
		general_courses,
		general_type_map,
		summer_depts: Array.from(summer_depts),
		dept_map,
		grade_map
	}
})

function isGeneralPracticeCourse(course, categories) {
	return course.dept?.includes('通識中心') &&
	course.enroll_type === '必修' &&
	categories.some(category => course.name.includes(category))
}

function quickButtonName(button, year) {
	const categories = button.lock?.categories
	if (categories?.length > 1) return year >= 112 ? categories[0] : categories[1]
	return button.title
}

const quick_buttons = computed(() => {
	const year = Number(selected_term_id.value.split('-')[0])
	return QUICK_BUTTONS.map(button => {
		const title = quickButtonName(button, year)
		const query = quickButtonQuery(button, title)
		return {
			...button,
			title,
			locked: !query,
			query
		}
	})
})

const current_term = computed(() => Number(selected_term_id.value.split('-')[1]))
const is_summer = computed(() => isSummerTerm(current_term.value))

const class_schedule_title = computed(() =>
	is_summer.value ? '各系暑修課程' : '各班必修 / 年級選修'
)

const summer_departments = computed(() => is_summer.value ? course_index.value.summer_depts : [])

const class_schedules = computed(() => {
	const { dept_map, grade_map } = course_index.value
	const list = Array.from(dept_map, ([department, class_map]) => {
		const classes = Array.from(class_map.values())
		const hide_class_group = new Set(classes.map(cls => cls.class_group)).size <= 1
		const short_name = DEPT_SHORT_NAME_IN_CLASS[department] || department
		return {
			id: department,
			department,
			recent: department === recent_dept,
			classes: classes
				.map(cls => ({
					...cls,
					name: `${short_name}${GRADE_LABELS[cls.grade - 1] || cls.grade}${hide_class_group ? '' : cls.class_group}`,
					grade_class: `${cls.grade}-${cls.class_group}`,
					mixed: canShowMixedGrade(department, cls.class_group, grade_map.get(`${department}-${cls.grade}`))
				}))
				.sort((a, b) => a.grade - b.grade)
		}
	})
	if (recent_dept) list.sort((a, b) => (b.department === recent_dept) - (a.department === recent_dept))
	return list
})

function rememberDept(department) {
	localStorage.setItem('mcv2-recent-dept', department)
}

function generalTypeCourse(name) {
	for (const [general_type, course] of course_index.value.general_type_map) {
		if (general_type.includes(name)) return course
	}
	return null
}

function quickButtonQuery(button, name) {
	if (button.key === 'advanced') return { }
	if (button.key === 'pe') {
		if (!course_index.value.has_pe) return null
		return { dept: '體育組-四技(日)', grade_class: '2-甲', enroll_type: 'any' }
	}
	const lock = button.lock
	if (lock?.kind === 'ge_practice') {
		const course = course_index.value.general_courses.find(course => isGeneralPracticeCourse(course, lock.categories))
		if (!course) return null
		return { dept: course.dept, grade_class: 'any', enroll_type: course.enroll_type, kw: '社會實踐' }
	}
	if (lock?.kind === 'ge') {
		const course = generalTypeCourse(name)
		if (!course) return null
		return { dept: course.dept, grade_class: 'any', enroll_type: name }
	}
	return null
}

function onLockedButton() {
	toast.warning('這個學期沒有開設此類課程', {
		description: '請切換學期或改天再試'
	})
}
</script>

<template>
	<LoadingOverlay v-if="loading" text="課表讀取中…" />
	<LoadError v-else-if="load_error" @retry="loadCourseList()" />

	<div class="flex flex-col gap-8 md:gap-24 pb-10 px-3 lg:px-0">
		<section class="relative">
			<div class="pointer-events-none absolute inset-y-0 left-1/2 -z-10 w-screen -translate-x-1/2"></div>
			<div class="mx-auto flex max-w-5xl flex-col items-center gap-4 text-center sm:pt-24">
				<div class="w-full">
					<div class="-mx-4 flex flex-col gap-2 bg-transparent sm:bg-color-1 p-3 sm:mx-0 sm:flex-row sm:rounded-lg sm:border sm:shadow-sm">
						<TermSelect
							v-model="selected_term_id"
							:term-list="term_list"
							trigger-class="h-14 w-full justify-between border-0 text-lg shadow-none focus-visible:ring-0 data-[size=default]:h-14 sm:w-56"
							content-class="max-w-[100vw] sm:-translate-x-3"
						/>

						<div class="bg-color-3 hidden sm:block sm:h-8 sm:w-px sm:self-center"></div>

						<div class="relative flex-1">
							<Input
								v-model="keyword"
								placeholder="搜尋課程名稱、老師、代碼..."
								aria-label="搜尋課程"
								class="h-14 border-0 text-lg md:text-lg shadow-none focus-visible:border-0 focus-visible:ring-0"
								@focus="search_open = true"
								@blur="search_open = false"
							/>

							<div v-if="search_open" class="absolute top-full right-0 left-0 z-50 mt-4 max-h-[60dvh] sm:-right-3 overflow-y-auto rounded-lg border bg-color-1 text-left shadow-sm" @mousedown.prevent>
								<template v-if="!debounced_keyword.trim()">
									<SearchHistory v-if="search_history.length" @select="keyword = $event" />
									<p v-else class="text-color-6 px-5 py-8 text-center text-base">請輸入關鍵字</p>
								</template>
								<template v-else-if="has_results">
									<template v-if="course_results.length">
										<div class="bg-color-2/50 flex items-center justify-between px-5 py-2">
											<p class="text-color-6 text-xs font-medium">課程 ({{ course_results.length }})</p>
											<RouterLink
												class="text-color-6 hover:text-color-10 flex items-center gap-0.5 text-xs"
												:to="{ name: 'course', query: {
													kw: debounced_keyword.trim(),
													dept: 'any',
													grade_class: 'any',
													enroll_type: 'any'
												} }"
												@click="rememberKeyword()"
											>
												顯示 {{ course_results.length }} 筆相符課程
												<ChevronRight class="size-3.5" />
											</RouterLink>
										</div>
										<RouterLink
											v-for="course in visible_courses"
											:key="course.id"
											class="hover:bg-color-2 flex w-full flex-col gap-1 border-b px-5 py-3 text-left sm:flex-row sm:items-center sm:gap-4"
											:to="courseRoutePath(course.id)"
											@click="rememberKeyword()"
										>
											<span class="w-full truncate text-base font-medium sm:min-w-0 sm:flex-1">{{ course.name }}</span>
											<span class="text-color-6 w-full text-xs sm:w-auto sm:shrink-0">{{ formatDeptClass(course) }}・{{ course.enroll_type }} {{ course.credit }} 學分・{{ course.teacher }} 老師</span>
										</RouterLink>
									</template>
									<template v-if="teacher_results.length">
										<p class="text-color-6 bg-color-2/50 px-5 py-2 text-xs font-medium">授課老師 ({{ teacher_results.length }})</p>
										<div class="flex flex-wrap gap-2 px-5 py-3">
											<RouterLink
												v-for="teacher in teacher_results"
												:key="teacher.name"
												class="hover:bg-color-2 hover:border-color-4 flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm"
												:to="{ name: 'course', query: {
													kw: teacher.name,
													dept: 'any',
													grade_class: 'any',
													enroll_type: 'any'
												} }"
												@click="rememberKeyword(teacher.name)"
											>
												<span class="font-medium">{{ teacher.name }}</span>
												<span class="text-color-6 text-xs">{{ teacher.count }}</span>
											</RouterLink>
										</div>
									</template>
								</template>
								<div v-else class="px-5 py-8">
									<p class="text-color-6 text-center text-base">這個學期找不到符合的課程</p>
									<div class="mt-4 flex flex-wrap justify-center gap-2">
										<CrossTermResult
											:result="cross_term_result"
											:loading="cross_term_loading"
											@select-term="switchTermAndSearch($event)"
										/>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</section>
		<section class="flex flex-col gap-3 w-full max-w-5xl mx-auto">
			<h2 class="text-lg font-semibold tracking-tight">常用查詢</h2>
			<div class="grid grid-cols-2 gap-3 md:grid-cols-4">
				<component
					:is="item.locked ? 'button' : RouterLink"
					v-for="item in quick_buttons"
					:key="item.key"
					class="relative flex flex-col gap-1 overflow-hidden rounded-lg border bg-color-1 p-4 text-left"
					:class="[
						item.span_full ? 'col-span-2' : '',
						item.locked ? 'cursor-not-allowed opacity-60' : 'hover:bg-color-2 hover:border-color-4'
					]"
					:to="item.locked ? undefined : { name: 'course', query: item.query }"
					@click="item.locked ? onLockedButton() : undefined"
				>
					<component :is="item.icon" class="pointer-events-none absolute -right-3 -bottom-3 size-16 text-color-3/70"/>
					<div class="relative flex items-center gap-1.5">
						<span class="text-sm truncate font-medium">{{ item.title }}</span>
						<span v-if="item.hot" class="rounded-full bg-red-500 text-white px-1.5 py-0.5 text-[10px] font-semibold tracking-widest">Hot!</span>
					</div>
					<span class="text-color-6 relative text-xs" v-if="item.description">{{ item.description }}</span>
				</component>
			</div>
		</section>

		<section class="flex flex-col gap-3 w-full max-w-5xl mx-auto">
			<h2 class="text-lg font-semibold tracking-tight">{{ class_schedule_title }}</h2>
			<template v-if="is_summer">
				<p v-if="!summer_departments.length" class="text-color-6 text-sm">目前沒有班級課表資料</p>
				<div v-else class="grid grid-cols-2 gap-3 sm:grid-cols-4">
					<RouterLink
						v-for="dept in summer_departments"
						:key="dept"
						class="hover:bg-color-2 hover:border-color-4 flex flex-col gap-1 rounded-lg border bg-color-1 p-4 text-left"
						:to="{ name: 'course', query: {
							dept,
							grade_class: 'any',
							enroll_type: 'any'
						} }"
					>
						<span class="text-sm font-medium">{{ dept }}</span>
					</RouterLink>
				</div>
			</template>
			<template v-else>
				<p v-if="!class_schedules.length" class="text-color-6 text-sm">目前沒有班級課表資料</p>
				<Accordion v-else type="single" collapsible>
					<AccordionItem
						v-for="dept in class_schedules"
						:key="dept.id"
						:value="dept.id"
					>
						<AccordionTrigger class="hover:no-underline">
							<span class="flex items-center gap-2">
								{{ dept.department }}
								<span v-if="dept.recent" class="bg-color-3 text-color-6 rounded-full px-2 py-0.5 text-[10px] font-medium">上次查詢</span>
							</span>
						</AccordionTrigger>
						<AccordionContent>
							<div class="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
								<RouterLink
									v-for="cls in dept.classes"
									:key="cls.id"
									class="hover:bg-color-2 hover:border-color-4 flex flex-col rounded-lg border bg-color-1 p-3 text-left"
									:to="{ name: 'course', query: {
										dept: dept.department,
										grade_class: cls.grade_class,
										enroll_type: cls.mixed ? 'mixed' : 'any'
									} }"
									@click="rememberDept(dept.department)"
								>
									<span class="text-sm font-medium">{{ cls.name }}</span>
								</RouterLink>
							</div>
						</AccordionContent>
					</AccordionItem>
				</Accordion>
			</template>
		</section>
	</div>
</template>
