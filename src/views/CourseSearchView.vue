<script setup>
import { ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { CalendarOff, Funnel, Star, TriangleAlert } from '@lucide/vue'
import { formatMixed, isAltCourse, altFor, narrowWeekdays, narrowWeekdayDept, maxTableStack, hasMultiClassElective, isGradeClass, MAX_TABLE_COLS, favoriteCourseId, useCourseList, useConflictIds } from '@/lib/course'
import { ANY_FILTER, altForKey, isClassRequiredCourse, matchCourses, matchAltCourses, countMatchedCourses, filterCount, relaxOptions } from '@/lib/course-filter'
import { formatTermShort, termIdFromCourseId, applyUrlTermId } from '@/lib/term'
import { useFavorite } from '@/lib/favorite'
import { useCrossTermSearch } from '@/lib/course-search'
import { useLocalRef } from '@/lib/storage'
import { useDebouncedRef } from '@/lib/utils'
import { isDayBachelorDept } from '@/lib/dept'
import LoadingOverlay from '@/components/LoadingOverlay.vue'
import LoadError from '@/components/LoadError.vue'
import CourseFilter from '@/components/CourseFilter.vue'
import HelpDialog from '@/components/HelpDialog.vue'
import FilterSidebar from '@/components/FilterSidebar.vue'
import FilterSummary from '@/components/FilterSummary.vue'
import CourseEmpty from '@/components/CourseEmpty.vue'
import CrossTermResult from '@/components/CrossTermResult.vue'
import CourseList from '@/components/CourseList.vue'
import CourseTable from '@/components/CourseTable.vue'
import AltCourseDialog, { useAltCourseDialog } from '@/components/AltCourseDialog.vue'
import ConfirmDialog from '@/components/ConfirmDialog.vue'
import ViewModeTabs from '@/components/ViewModeTabs.vue'
import SponsorAd from '@/components/SponsorAd.vue'
import { toast } from '@/components/ui/sonner'
import { Button } from '@/components/ui/button'

const MAX_EMPTY_ACTIONS = 3

const sidebar_open = ref(false)
const clear_favorite_dialog_open = ref(false)
const view_mode = useLocalRef('mcv2-search-view', 'list', undefined, v => ['list', 'table'].includes(v))

const { alt_dialog, openAlt } = useAltCourseDialog()

const route = useRoute()
const router = useRouter()
applyUrlTermId(route, router)
const { favorite_ids, isFavorite, addFavorites, removeFavorites } = useFavorite()
const keyword = ref(typeof route.query.kw === 'string' ? route.query.kw : '')
const debounced_keyword = useDebouncedRef(keyword)
const selected_dept = useLocalRef('mcv2-selected-dept', 'any', route.query.dept)
const selected_grade_class = useLocalRef('mcv2-selected-grade-class', 'any', route.query.grade_class, v => v === 'any' || isGradeClass(v))
const selected_enroll_type = useLocalRef('mcv2-selected-enroll-type', 'any', route.query.enroll_type)
const selected_conflict_mode = useLocalRef('mcv2-conflict-mode', 'show', undefined, v => ['show', 'bottom', 'hide'].includes(v))

const is_wide_filter = computed(() => selected_dept.value === 'any' && !keyword.value.trim())

const { selected_term_id, term_list, course_list, loading, loaded, load_error, loadCourseList } = useCourseList({ is_heavy: is_wide_filter })

const current_filter = computed(() => ({
	dept: selected_dept.value,
	grade_class: selected_grade_class.value,
	enroll_type: selected_enroll_type.value,
	kw: debounced_keyword.value.trim().toLowerCase()
}))

const base_filtered_list = computed(() => matchCourses(course_list.value, current_filter.value))

const alt_course_list = computed(() => matchAltCourses(course_list.value, current_filter.value))

const matched_list = computed(() => [...alt_course_list.value, ...base_filtered_list.value])

const conflict_ids = useConflictIds(course_list)

const hidden_conflict_count = computed(() => {
	if (selected_conflict_mode.value !== 'hide') return 0
	return matched_list.value.filter(course => conflict_ids.value.has(course.id)).length
})

const filtered_course_list = computed(() => {
	const list = matched_list.value
	const ids = conflict_ids.value
	if (selected_conflict_mode.value === 'hide') return list.filter(course => !ids.has(course.id))
	if (selected_conflict_mode.value === 'bottom') return [...list].sort((a, b) => (ids.has(a.id) ? 1 : 0) - (ids.has(b.id) ? 1 : 0))
	return list
})

const short_id_hint = computed(() => /^\d{1,3}$/.test(current_filter.value.kw) ? '課程序號要輸入 4 碼以上才會比對' : '')

const empty_actions = computed(() => {
	if (filtered_course_list.value.length) return []
	if (hidden_conflict_count.value) return [{ key: 'conflict', label: '顯示衝堂課程' }]
	const actions = []
	for (const option of relaxOptions(current_filter.value)) {
		if (actions.length >= MAX_EMPTY_ACTIONS) break
		const count = countMatchedCourses(course_list.value, option.filter)
		if (count) actions.push({ ...option, count })
	}
	if (actions.length || current_filter.value.kw || !filterCount(current_filter.value)) return actions
	const count = countMatchedCourses(course_list.value, ANY_FILTER)
	return count ? [{ key: 'clear', label: '清除所有條件', filter: ANY_FILTER, count }] : []
})

const empty_state = computed(() => {
	if (filtered_course_list.value.length) return null
	if (hidden_conflict_count.value) {
		return {
			title: `符合的 ${hidden_conflict_count.value} 門課程都被隱藏了`,
			description: '這些課程與你收藏的課程時間重疊，可改為顯示或置底'
		}
	}
	if (empty_actions.value.length) {
		return {
			title: '找不到符合條件的課程',
			description: '試試放寬其中一個條件'
		}
	}
	const kw = debounced_keyword.value.trim()
	if (kw) {
		return {
			title: '找不到符合條件的課程',
			description: `這個學期沒有名稱、老師或序號包含「${kw}」的課程`
		}
	}
	return {
		title: '找不到符合條件的課程',
		description: '請嘗試修改搜尋條件，或選擇其他學期'
	}
})

const cross_term_enabled = computed(() =>
	loaded.value && !loading.value && !!current_filter.value.kw && !filtered_course_list.value.length && !hidden_conflict_count.value
)

const { result: cross_term_result, loading: cross_term_loading } = useCrossTermSearch(debounced_keyword, cross_term_enabled)

const has_empty_extra = computed(() => !!empty_actions.value.length || cross_term_loading.value || !!cross_term_result.value.total)

function switchTermKeywordOnly(term_id) {
	selected_dept.value = ANY_FILTER.dept
	selected_grade_class.value = ANY_FILTER.grade_class
	selected_enroll_type.value = ANY_FILTER.enroll_type
	selected_term_id.value = term_id
}

function applyEmptyAction(action) {
	if (action.key === 'conflict') {
		selected_conflict_mode.value = 'show'
		return
	}
	selected_dept.value = action.filter.dept
	selected_grade_class.value = action.filter.grade_class
	selected_enroll_type.value = action.filter.enroll_type
	if (!action.filter.kw) keyword.value = ''
}

const narrow_weekday_dept = computed(() => narrowWeekdayDept(filtered_course_list.value))
const narrow_weekdays = computed(() => narrowWeekdays(filtered_course_list.value, narrow_weekday_dept.value))

const table_view_disabled = computed(() => {
	if (!filtered_course_list.value.length) return false
	if (narrow_weekday_dept.value) return !narrow_weekdays.value
	return maxTableStack(filtered_course_list.value) > MAX_TABLE_COLS
})

const table_grade_class = computed(() => {
	if (selected_enroll_type.value !== 'mixed') return 'any'
	if (!hasMultiClassElective(course_list.value, selected_dept.value, selected_grade_class.value)) return 'any'
	return selected_grade_class.value
})

const table_filter = computed(() => ({
	dept: selected_dept.value,
	grade_class: selected_grade_class.value
}))

const filter_summary = computed(() => {
	const info = []
	if (selected_term_id.value) info.push(formatTermShort(selected_term_id.value))
	if (selected_dept.value !== 'any') {
		const cls = selected_grade_class.value !== 'any' ? selected_grade_class.value.replace('-', ' ') : '全年級'
		info.push(`${selected_dept.value} ${cls}`)
	}
	if (selected_enroll_type.value === 'mixed') info.push(formatMixed(selected_grade_class.value))
	else if (selected_enroll_type.value !== 'any') info.push(selected_enroll_type.value)
	if (debounced_keyword.value.trim()) info.push(`關鍵字：${debounced_keyword.value.trim()}`)
	if (info.length === 1 && selected_term_id.value) info.push('全部課程')
	return info
})

const can_show_class_required = computed(() =>
	selected_dept.value !== 'any' &&
	selected_grade_class.value !== 'any' &&
	isDayBachelorDept(selected_dept.value)
)

const class_required_courses = computed(() => {
	if (!can_show_class_required.value) return []
	const alt_key = altForKey(selected_dept.value, selected_grade_class.value)
	return course_list.value.filter(course => {
		if (isAltCourse(course)) return altFor(course).includes(alt_key)
		return isClassRequiredCourse(course, selected_dept.value, selected_grade_class.value)
	})
})

const class_required_all_favorited = computed(() => {
	const courses = class_required_courses.value
	return courses.length > 0 && courses.every(course => isFavorite(favoriteCourseId(course)))
})

const current_term_favorite_count = computed(() => {
	let count = 0
	for (const id of favorite_ids.value) {
		if (termIdFromCourseId(id) === selected_term_id.value) count++
	}
	return count
})

function addClassRequiredFavorites() {
	const added = addFavorites(class_required_courses.value.map(course => favoriteCourseId(course)))
	if (added) toast.success(`已收藏 ${added} 門本班必修課`)
	else toast.info('本班必修課已全部收藏')
}

function favoriteClassRequired() {
	const courses = class_required_courses.value
	if (!courses.length) {
		toast.error('本班沒有必修課程')
		return
	}
	if (class_required_all_favorited.value) {
		toast.info('本班必修課已全部收藏')
		return
	}
	if (current_term_favorite_count.value) {
		clear_favorite_dialog_open.value = true
		return
	}
	addClassRequiredFavorites()
}

function clearThenFavoriteClassRequired() {
	const term_id = selected_term_id.value
	const removed = removeFavorites([...favorite_ids.value].filter(id => termIdFromCourseId(id) === term_id))
	const added = addFavorites(class_required_courses.value.map(course => favoriteCourseId(course)))
	toast.success(`已清除 ${removed} 門舊收藏，並收藏 ${added} 門本班必修課`)
}

watch([debounced_keyword, selected_dept, selected_grade_class, selected_enroll_type], () => {
	const query = {}
	const kw = debounced_keyword.value.trim()
	if (kw) query.kw = kw
	if (selected_dept.value !== 'any') query.dept = selected_dept.value
	if (selected_grade_class.value !== 'any') query.grade_class = selected_grade_class.value
	if (selected_enroll_type.value !== 'any') query.enroll_type = selected_enroll_type.value
	router.replace({ query })
})

watch(selected_enroll_type, enroll_type => {
	if (enroll_type !== 'any' && enroll_type.includes('_')) selected_grade_class.value = 'any'
})
</script>

<template>
	<LoadingOverlay v-if="loading" text="課表讀取中…" />
	<LoadError v-else-if="load_error" @retry="loadCourseList()" />

	<div class="flex w-full flex-1 flex-col">
		<div class="mx-auto flex w-full max-w-7xl flex-1 lg:px-4">
			<FilterSidebar v-model:open="sidebar_open">
				<CourseFilter
					v-model:term-id="selected_term_id"
					v-model:keyword="keyword"
					v-model:dept="selected_dept"
					v-model:grade-class="selected_grade_class"
					v-model:enroll-type="selected_enroll_type"
					v-model:conflict-mode="selected_conflict_mode"
					:term-list="term_list"
					:course-list="course_list"
					:disabled="loading"
				/>

				<div class="text-color-6 mt-6 whitespace-nowrap text-xs lg:hidden">
					{{ filtered_course_list.length }} 門符合的課程<span v-if="hidden_conflict_count">（{{ hidden_conflict_count }} 門衝堂已隱藏）</span>
				</div>

				<Button
					v-if="can_show_class_required"
					variant="outline"
					class="w-full bg-color-1 mt-6 lg:mt-0"
					:class="class_required_all_favorited && 'cursor-not-allowed opacity-40 hover:bg-color-1 hover:text-current'"
					@click="favoriteClassRequired"
				>
					<Star class="size-4" :class="class_required_all_favorited && 'fill-amber-400 text-amber-400'" />
					收藏本班必修課
				</Button>

				<template #footer>
					<HelpDialog button-class="-ml-2">
						<li>點課程名稱可查看詳細資訊，點課程右側的 <Star class="inline-block size-3.5 align-middle text-amber-400" /> 可收藏課程</li>
						<li>與<b class="font-medium">已收藏課程</b>時間重疊的課程會標示 <TriangleAlert class="inline-block size-3.5 align-middle text-red-500" />，並可設定是否要顯示</li>
						<li>建議可以先<b class="font-medium">選擇自己的班級後，用「收藏本班必修課」一次收藏整班必修</b>，再去看其他想修的課程</li>
						<li>如想查詢通識課，開課單位請選「通識中心四技」；如想查詢自選體育課程，開課單位請選「體育組」</li>
					</HelpDialog>
				</template>
			</FilterSidebar>

			<div class="min-w-0 w-full flex-1 flex flex-col lg:pl-6">
				<div class="bg-color-2/90 sticky top-[var(--nav-h)] z-30 flex items-center gap-2 px-3 py-0.5 print:hidden">
					<button
						class="-ml-3 flex min-w-0 flex-1 items-center justify-start gap-2 px-3 py-2 text-sm font-medium lg:hidden"
						@click="sidebar_open = true"
					>
						<Funnel class="size-5 shrink-0 print:hidden" />
						<span class="min-w-0 text-left">
							<FilterSummary :parts="filter_summary" fallback="篩選" />
						</span>
					</button>

					<div class="text-color-6 hidden min-w-0 flex-1 truncate py-2 text-sm lg:block">
						{{ filtered_course_list.length }} 門符合的課程<span v-if="hidden_conflict_count">（{{ hidden_conflict_count }} 門衝堂已隱藏）</span>
					</div>

					<ViewModeTabs v-model="view_mode" compact root-class="ml-auto shrink-0 print:hidden" />
				</div>

				<div v-if="loaded" class="mb-4 flex flex-1 flex-col">
					<CourseEmpty v-if="empty_state" :title="empty_state.title" container-class="h-auto flex-1 px-3 py-20">
						{{ empty_state.description }}
						<span v-if="short_id_hint" class="mt-1 block">{{ short_id_hint }}</span>
						<template #extra>
							<div v-if="has_empty_extra" class="mt-2 flex flex-wrap justify-center gap-2">
								<Button
									v-for="action in empty_actions"
									:key="action.key"
									variant="outline"
									size="sm"
									class="bg-color-1"
									@click="applyEmptyAction(action)"
								>
									{{ action.label }}
									<span v-if="action.count" class="text-color-6">{{ action.count }} 門</span>
								</Button>
								<CrossTermResult
									:result="cross_term_result"
									:loading="cross_term_loading"
									@select-term="switchTermKeywordOnly($event)"
								/>
							</div>
						</template>
					</CourseEmpty>
					<CourseEmpty
						v-else-if="view_mode === 'table' && table_view_disabled"
						:icon="CalendarOff"
						title="目前結果不支援課表檢視"
						container-class="h-auto flex-1 px-3 py-20"
					>
						單日重疊的課程太多，請切換條件或改用列表檢視
						<template #extra>
							<div class="mt-2">
								<Button variant="outline" size="sm" class="bg-color-1" @click="view_mode = 'list'">
									改用列表檢視
								</Button>
							</div>
						</template>
					</CourseEmpty>
					<CourseTable v-else-if="view_mode === 'table'" :courses="filtered_course_list" :narrow-days="narrow_weekdays" :grade-class="table_grade_class" :filter="table_filter" @alt-click="openAlt($event)" />
					<CourseList v-else :courses="filtered_course_list" :conflict-ids="conflict_ids" @alt-click="openAlt($event)" />

					<SponsorAd v-if="filtered_course_list.length" section-class="mt-4 print:hidden" title-class="px-3" card-class="mx-0 rounded-none md:rounded-none md:border-x-0 lg:mx-3 lg:rounded-lg lg:border-x-3" />
				</div>
			</div>
		</div>

		<AltCourseDialog ref="alt_dialog" :course-list="course_list" />

		<ConfirmDialog
			v-model:open="clear_favorite_dialog_open"
			:title="`本學期已有收藏 ${current_term_favorite_count} 門課程`"
			description="是否要清空這個學期已收藏的課程後，再收藏本班必修課？"
			confirm-text="直接收藏"
			alt-text="清空後收藏"
			@confirm="addClassRequiredFavorites()"
			@alt="clearThenFavoriteClassRequired()"
		/>
	</div>
</template>
