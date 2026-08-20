<script setup>
import { ref, computed, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { Users, Clock, CalendarClock, Info, ChevronRight } from '@lucide/vue'
import TeacherIcon from '@/components/icons/TeacherIcon.vue'
import { getCourseDetail, getSimilarCourses } from '@/api/course'
import { formatCourseTime, formatCourseTimes, formatSectionRange, courseIdFromRoute, getCourseBasic, getCourseMap, formatLimit, formatDeptClass, courseGradeClass, teacherName, hasRemark, isNoFixedTime, isBlockCourse, isAltCourse, conflictingCourses, FULL_WEEKDAY_LABELS } from '@/lib/course'
import { termIdFromCourseId, formatTermLabel, getStoredTermList, useSelectedTerm } from '@/lib/term'
import { useLatestRequest } from '@/lib/loader'
import { setPageMeta } from '@/lib/meta'
import { sendPageView } from '@/lib/analytics'
import { coursePageMeta } from '@/config/page-meta'
import { useFavorite } from '@/lib/favorite'
import { Badge } from '@/components/ui/badge'
import CourseRow from '@/components/CourseRow.vue'
import CourseBadges from '@/components/CourseBadges.vue'
import EnrollBadge from '@/components/EnrollBadge.vue'
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import LoadingOverlay from '@/components/LoadingOverlay.vue'
import LoadError from '@/components/LoadError.vue'
import FavoriteStar from '@/components/FavoriteStar.vue'
import NotFoundState from '@/components/NotFoundState.vue'
import CourseListDialog from '@/components/CourseListDialog.vue'
import DefinitionList from '@/components/DefinitionList.vue'
import DefinitionRow from '@/components/DefinitionRow.vue'
import InlineLoading from '@/components/InlineLoading.vue'
import SponsorAd from '@/components/SponsorAd.vue'

const route = useRoute()
const { favorite_ids } = useFavorite()
const { selected_term_id } = useSelectedTerm()

const loading = ref(false)
const detail_loading = ref(false)
const load_error = ref(false)
const course = ref(null)
const detail = ref([])
const office_time = ref([])
const schedule = ref([])
const similar_courses = ref([])
const similar_open = ref(false)
const favorite_courses = ref([])

const startFavoriteRequest = useLatestRequest()
const startLoadRequest = useLatestRequest()
const favorite_course_map = new Map()

const newest_year = computed(() => getStoredTermList().map(t => t.slice(0, 3)).sort().at(-1) || '')

const other_similar = computed(() =>
	similar_courses.value
		.filter(c => c.id !== course.value?.id)
		.sort((a, b) => b.id.localeCompare(a.id))
)

const grouped_similar = computed(() => {
	const groups = []
	const group_map = {}
	for (const c of other_similar.value) {
		const term_id = termIdFromCourseId(c.id)
		if (!group_map[term_id]) {
			group_map[term_id] = { term_id, label: formatTermLabel(term_id), courses: [] }
			groups.push(group_map[term_id])
		}
		group_map[term_id].courses.push(c)
	}
	return groups
})

const has_newest_year = computed(() =>
	year.value != newest_year.value && similar_courses.value.some(c => c.id.slice(0, 3) == newest_year.value)
)

const has_other_year = computed(() =>
	similar_courses.value.some(c => c.id.slice(0, 3) != year.value)
)

const has_extra = computed(() =>
	detail.value.length > 0 || office_time.value.length > 0 || schedule.value.length > 0
)

const has_limit = computed(() => course.value?.max != null && course.value?.min != null)

const has_course_info = computed(() =>
	course.value?.hour != null || has_limit.value || detail.value.length > 0
)

const deptClass = computed(() => course.value ? formatDeptClass(course.value) : '')

const teacher_name = computed(() => teacherName(course.value))

const dept_class_query = computed(() => {
	if (!course.value?.dept) return null
	return {
		term_id: termIdFromCourseId(course.value.id),
		dept: course.value.dept,
		grade_class: courseGradeClass(course.value) || 'any',
		enroll_type: 'any'
	}
})

const teacher_query = computed(() => {
	if (!teacher_name.value) return null
	return {
		term_id: termIdFromCourseId(course.value.id),
		kw: teacher_name.value,
		dept: 'any',
		grade_class: 'any',
		enroll_type: 'any'
	}
})

const no_fixed_time = computed(() => isNoFixedTime(course.value))

const block_course = computed(() => isBlockCourse(course.value))

const conflict_courses = computed(() => conflictingCourses(course.value, favorite_courses.value))

const is_alt = computed(() => !!course.value && isAltCourse(course.value))

const year = computed(() => course.value?.id.slice(0, 3) || '')
const term_label = computed(() => course.value ? formatTermLabel(termIdFromCourseId(course.value.id)) : '')

function syncCourseTerm(favorite_course) {
	selected_term_id.value = termIdFromCourseId(favorite_course.id)
}

async function loadBasic(id, isLatest) {
	try {
		const basic = await getCourseBasic(id)
		if (!isLatest()) return null
		if (basic) course.value = basic
		return basic
	} catch (error) {
		console.error(error)
		return null
	}
}

async function loadDetail(id, basic_promise, isLatest) {
	detail_loading.value = true
	try {
		const data = await getCourseDetail(id)
		await basic_promise
		if (!isLatest()) return false
		if (data.course) course.value = { ...course.value, ...data.course }
		detail.value = data.detail || []
		office_time.value = data.office_time || []
		schedule.value = data.schedule || []
		return true
	} catch (error) {
		console.error(error)
		return false
	} finally {
		if (isLatest()) detail_loading.value = false
	}
}

async function loadSimilar(id, isLatest) {
	try {
		const courses = await getSimilarCourses(id)
		if (isLatest()) similar_courses.value = courses
	} catch (error) {
		console.error(error)
		if (isLatest()) similar_courses.value = []
	}
}

async function loadFavoriteCourses(id) {
	const term_id = termIdFromCourseId(id)
	const ids = [...favorite_ids.value].filter(favorite_id => favorite_id !== id && termIdFromCourseId(favorite_id) === term_id)
	const isLatest = startFavoriteRequest()
	if (!ids.length) {
		favorite_courses.value = []
		return
	}
	const unknown_ids = ids.filter(favorite_id => !favorite_course_map.has(favorite_id))
	if (unknown_ids.length) {
		try {
			const map = await getCourseMap(unknown_ids)
			for (const [course_id, favorite] of map) favorite_course_map.set(course_id, favorite)
		} catch (error) {
			console.error(error)
		}
	}
	if (!isLatest()) return
	favorite_courses.value = ids.map(favorite_id => favorite_course_map.get(favorite_id)).filter(favorite => favorite?.time?.length)
}

async function load(id = courseIdFromRoute(route.params.short_term_id, route.params.course_no)) {
	if (!id) return
	const isLatest = startLoadRequest()
	course.value = null
	load_error.value = false
	detail.value = []
	office_time.value = []
	schedule.value = []
	similar_courses.value = []
	similar_open.value = false
	loading.value = true
	loadSimilar(id, isLatest)
	const basic_promise = loadBasic(id, isLatest)
	const detail_promise = loadDetail(id, basic_promise, isLatest)
	const basic = await basic_promise
	if (!isLatest()) return
	loading.value = false
	const detail_ok = await detail_promise
	if (!isLatest()) return
	if (!basic && !detail_ok) {
		course.value = null
		load_error.value = true
	}
}

watch(course, c => {
	if (!c) return
	setPageMeta(coursePageMeta(c))
	sendPageView(route.fullPath)
})

function scheduleDate(row) {
	const [year, month, date] = row[0].split('/').map(Number)
	const day = new Date(year, month - 1, date)
	return `${month}/${date} (${FULL_WEEKDAY_LABELS[day.getDay()]}) ${row[1]}~${row[2]}`
}

const schedule_rows = computed(() => schedule.value.map(row => ({ row, date_text: scheduleDate(row) })))

const detail_rows = computed(() => detail.value.map(([label, content]) => ({
	label,
	content,
	tags: label === '教學方法' ? (content || '').split(',').map(t => t.trim()).filter(Boolean) : null
})))

watch(() => courseIdFromRoute(route.params.short_term_id, route.params.course_no), id => { if (id) load(id) }, { immediate: true })

watch([() => course.value?.id, favorite_ids], ([id]) => {
	if (id) loadFavoriteCourses(id)
	else favorite_courses.value = []
}, { immediate: true })
</script>

<template>
	<LoadingOverlay v-if="loading || (!course && detail_loading)" text="課程讀取中…" />
	<LoadError v-else-if="load_error" @retry="load()" />

	<NotFoundState v-else-if="!course" title="找不到這門課程" description="此門課程可能已下架" link-to="/course" link-text="重新查詢" />

	<div v-else class="mx-auto flex w-full max-w-4xl flex-col gap-8 py-6 px-3 lg:px-0">
		<section class="flex flex-col gap-4">
			<div class="flex items-start justify-between">
				<div class="flex flex-col gap-1.5">
					<div class="text-color-6 text-sm">
						{{ term_label }}<template v-if="!is_alt">・<span class="font-mono">{{ course.id }}</span></template>
					</div>
					<h1 class="text-2xl font-bold tracking-tight">{{ course.name }}</h1>
					<div class="flex flex-wrap items-center gap-2">
						<CourseBadges :course="course" credit-class="text-sm" />
					</div>
				</div>
				<FavoriteStar
					class="hover:bg-color-2 flex size-10 shrink-0 items-center justify-center rounded-lg"
					:course="course"
					:conflict="conflict_courses.length > 0"
					size="lg"
					@add="syncCourseTerm($event)"
				/>
			</div>

			<div class="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
				<div class="flex items-center gap-2">
					<Users class="text-color-5 size-4 shrink-0" />
					<RouterLink
						v-if="dept_class_query"
						class="hover:text-color-6 flex items-center gap-2"
						:to="{ name: 'course', query: dept_class_query }"
						aria-label="搜尋這個班級的課程"
					>
						<span>{{ deptClass }}</span>
						<ChevronRight class="text-color-5 size-4 shrink-0" />
					</RouterLink>
					<span v-else>{{ deptClass }}</span>
				</div>
				<div class="flex items-center gap-2">
					<TeacherIcon class="text-color-5 size-4 shrink-0" />
					<RouterLink
						v-if="teacher_query"
						class="hover:text-color-6 flex items-center gap-2"
						:to="{ name: 'course', query: teacher_query }"
						aria-label="搜尋這位老師的課程"
					>
						<span>{{ course.teacher }} 老師</span>
						<ChevronRight class="text-color-5 size-4 shrink-0" />
					</RouterLink>
					<span v-else>{{ course.teacher }} 老師</span>
				</div>
				<div class="col-span-full flex items-start gap-2">
					<Clock class="text-color-5 mt-0.5 size-4 shrink-0" />
					<div class="flex flex-wrap items-center gap-x-3 gap-y-1">
						<Dialog v-if="course.time?.length">
							<DialogTrigger class="hover:text-color-6 flex items-center gap-2" aria-label="查看上課時間">
								<span>{{ formatCourseTimes(course) }}</span>
								<Info class="text-color-5 size-4" />
							</DialogTrigger>
							<DialogContent class="max-w-xs">
								<DialogHeader>
									<DialogTitle>上課時間</DialogTitle>
								</DialogHeader>
								<p v-if="block_course" class="text-color-6 text-sm">
									塊狀課程實際上課日期請參考備註及教學進度表，或詢問授課老師及開課單位。
								</p>
								<p v-else-if="no_fixed_time" class="text-color-6 text-sm">
									系統上無表定上課時間，請參考備註及教學進度表，或詢問授課老師及開課單位。
								</p>
								<div v-else class="flex flex-col">
									<div class="flex max-h-[60dvh] flex-col overflow-y-auto">
										<div v-for="(time, index) in course.time" :key="index" class="flex items-center justify-between gap-3 py-1 text-sm">
											<span>{{ formatCourseTime(time, course) }}</span>
											<span class="text-color-6 font-num text-xs tabular-nums">{{ formatSectionRange(time.section) }}</span>
										</div>
									</div>
									<p class="text-color-6 mt-2 text-xs">
										實際上課日期請參考備註及教學進度表，或詢問授課老師及開課單位。
									</p>
								</div>
							</DialogContent>
						</Dialog>
						<span v-else class="text-color-6">未定</span>
					</div>
				</div>
				<div v-if="hasRemark(course)" class="col-span-full flex items-start gap-2">
					<Info class="text-color-5 mt-0.5 size-4 shrink-0" />
					<span class="whitespace-pre-line">{{ course.remark }}</span>
				</div>
			</div>

			<CourseListDialog v-if="other_similar.length" v-model:open="similar_open" title="歷年開課 / 各系所開課" :count="other_similar.length" list-class="gap-0">
				<template #trigger>
					<DialogTrigger
						class="bg-color-1 hover:bg-color-3 flex w-full items-center gap-3 rounded-lg border p-4 text-left text-sm"
					>
						<CalendarClock class="text-color-6 size-5 shrink-0" />
						<span class="flex-1">
							<template v-if="has_newest_year">正在查看前幾學期的開課資料，這門課在 {{ newest_year }} 學年也有開設！</template>
							<template v-else-if="has_other_year">這門課有在其他學年開設過，點此可查看歷年開課紀錄！</template>
							<template v-else>這門課也有其他系所開設，點此可查看開課資料！</template>
						</span>
						<ChevronRight class="text-color-5 size-4 shrink-0" />
					</DialogTrigger>
				</template>
				<div v-for="group in grouped_similar" :key="group.term_id" class="flex flex-col gap-1 pb-3 last:pb-0">
					<div class="text-color-6 bg-color-1 sticky -top-[2px] z-10 px-2 pt-2 pb-1 text-xs font-medium">
						{{ group.label }}
					</div>
					<CourseRow
						v-for="_course in group.courses"
						:key="_course.id"
						:course="_course"
						@click="similar_open = false"
					>
						<template #meta>
							<span>{{ formatDeptClass(_course) }}</span>
							<EnrollBadge :type="_course.enroll_type" />
							<span>{{ _course.credit }} 學分</span>
						</template>
					</CourseRow>
				</div>
			</CourseListDialog>
		</section>

		<section v-if="has_course_info" class="flex flex-col gap-3">
			<h2 class="text-color-6 text-xs">課程資訊</h2>
			<DefinitionList>
				<DefinitionRow v-if="course.hour != null" label="時數">
					{{ course.hour }} 小時
					<span class="text-color-6 text-xs">(實際上課時間以課表為準)</span>
				</DefinitionRow>
				<DefinitionRow v-if="has_limit" label="人數限制">{{ formatLimit(course.min, course.max) }}</DefinitionRow>
				<DefinitionRow
					v-for="({ label, content, tags }, index) in detail_rows"
					:key="index"
					:label="label"
					:dd-class="tags ? 'flex flex-wrap items-center gap-1.5' : 'whitespace-pre-line'"
				>
					<template v-if="tags">
						<Badge v-for="tag in tags" :key="tag" variant="secondary">{{ tag }}</Badge>
						<span v-if="!tags.length" class="text-color-4 text-sm">—</span>
					</template>
					<template v-else>
						<span v-if="(content || '').trim()">{{ content }}</span>
						<span v-else class="text-color-4">—</span>
					</template>
				</DefinitionRow>
			</DefinitionList>
		</section>

		<InlineLoading v-if="detail_loading" text="課程詳細資料讀取中…" container-class="border-y border-dashed py-10 text-center -mx-3 rounded-none sm:mx-0 sm:rounded-lg sm:border" />

		<p v-else-if="!has_extra" class="text-color-6 border-y border-dashed py-10 text-center text-sm -mx-3 rounded-none sm:mx-0 sm:rounded-lg sm:border">
			授課老師尚未填寫課程詳細資料
		</p>

		<section v-if="office_time.length" class="flex flex-col gap-3">
			<h2 class="text-color-6 text-xs">Office Hours</h2>
			<div class="flex flex-col divide-y border-y bg-color-1 -mx-3 rounded-none sm:mx-0 sm:rounded-lg sm:border">
				<div v-for="([teacher, time], index) in office_time" :key="index" class="flex flex-col gap-0.5 items-start p-4 text-sm">
					<span class="font-bold">{{ teacher }}</span>
					<span class="text-color-6 whitespace-pre-line">{{ (time || '').trim() || '未提供時間' }}</span>
				</div>
			</div>
		</section>

		<SponsorAd card-class="-mx-3 rounded-none sm:mx-0 sm:rounded-lg sm:border-x-3" />

		<section v-if="schedule.length" class="flex flex-col gap-3">
			<h2 class="text-color-6 text-xs">教學進度表</h2>
			<div class="border-y bg-color-1 -mx-3 rounded-none sm:mx-0 sm:rounded-lg sm:border">
				<table class="w-full text-sm">
					<tbody>
						<tr v-for="({ row, date_text }, index) in schedule_rows" :key="index" class="border-b last:border-0 align-top">
							<td class="text-color-6 w-28 px-4 py-3 align-top whitespace-nowrap sm:w-36 text-sm font-medium">
								<div>{{ date_text }}</div>
								<div v-if="(row[4] || '').trim()" class="mt-0.5">{{ row[4] }} 老師</div>
							</td>
							<td class="px-4 py-3 align-top">
								<div v-if="(row[5] || '').trim()" class="font-bold whitespace-pre-line">{{ row[5] }}</div>
								<div v-if="(row[7] || '').trim()" class="text-color-6 mt-1 whitespace-pre-line">{{ row[7] }}</div>
								<div v-if="(row[6] || '').trim()" class="text-color-6 mt-1 flex flex-wrap items-baseline gap-1.5 text-xs whitespace-pre-line">
									<Badge variant="secondary">作業</Badge>{{ row[6] }}
								</div>
								<div v-if="(row[8] || '').trim()" class="text-color-6 mt-1 flex flex-wrap items-baseline gap-1.5 text-xs whitespace-pre-line">
									<Badge variant="secondary">備註</Badge>{{ row[8] }}
								</div>
							</td>
						</tr>
					</tbody>
				</table>
			</div>
		</section>
	</div>
</template>
