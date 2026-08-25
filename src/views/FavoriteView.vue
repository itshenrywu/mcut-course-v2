<script setup>
import { ref, computed } from 'vue'
import { RouterLink } from 'vue-router'
import { Star, Trash2, TriangleAlert, X, Info } from '@lucide/vue'
import { useCourseList, useConflictIds, useArchivedFavorites, useFavoriteCourses, courseDisplayName, formatCourseMeta } from '@/lib/course'
import { termIdFromCourseId } from '@/lib/term'
import { useFavorite, useFavoriteTermCount, resyncFavorite } from '@/lib/favorite'
import { useLocalRef } from '@/lib/storage'
import { CREDIT_LIMITS } from '@/lib/enroll-time'
import { toast } from '@/components/ui/sonner'
import { Button, buttonVariants } from '@/components/ui/button'
import ConfirmDialog from '@/components/ConfirmDialog.vue'
import LoadingOverlay from '@/components/LoadingOverlay.vue'
import LoadError from '@/components/LoadError.vue'
import InlineLoading from '@/components/InlineLoading.vue'
import CourseEmpty from '@/components/CourseEmpty.vue'
import TermSelect from '@/components/TermSelect.vue'
import CourseList from '@/components/CourseList.vue'
import CourseTable from '@/components/CourseTable.vue'
import AltCourseDialog, { useAltCourseDialog } from '@/components/AltCourseDialog.vue'
import ViewModeTabs from '@/components/ViewModeTabs.vue'
import SponsorAd from '@/components/SponsorAd.vue'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

const view_mode = useLocalRef('mcv2-favorite-view', 'table', undefined, v => ['table', 'list'].includes(v))

const { alt_dialog, openAlt } = useAltCourseDialog()

const limit_dialog_open = ref(false)

const { favorite_ids, removeFavorites } = useFavorite()

resyncFavorite()

const clear_dialog_open = ref(false)
const { selected_term_id, term_list, course_list, loading, loaded, load_error, loadCourseList } = useCourseList()

const favorite_courses = useFavoriteCourses(course_list)

const total_credit = computed(() => favorite_courses.value.reduce((sum, course) => sum + (Number(course.credit) || 0), 0))

const conflict_ids = useConflictIds(favorite_courses)

const { archived_ids, archived_courses, archived_loading } = useArchivedFavorites(course_list, { loaded, load_error })

const archived_dialog_open = ref(false)

const archived_rows = computed(() => archived_courses.value.map(course => ({
	course,
	title: courseDisplayName(course),
	meta: course.name ? formatCourseMeta(course) : ''
})))

const { favorite_count_map, term_note_map } = useFavoriteTermCount()

const has_other_term_favorite = computed(() => {
	for (const term_id of favorite_count_map.value.keys()) {
		if (term_id !== selected_term_id.value) return true
	}
	return false
})

const current_term_favorite_count = computed(() => favorite_count_map.value.get(selected_term_id.value) || 0)

const empty_title = computed(() => {
	if (archived_ids.value.length) return '這個學期的收藏課程都已下架'
	return has_other_term_favorite.value ? '這個學期沒有收藏的課程' : '尚未收藏任何課程'
})

function clearTermFavorite() {
	const term_id = selected_term_id.value
	const ids = [...favorite_ids.value].filter(id => termIdFromCourseId(id) === term_id)
	const removed = removeFavorites(ids)
	if (!removed) return
	toast.success(`已清除 ${term_id} 收藏的 ${removed} 門課程`)
}

function removeArchivedCourse(course, title) {
	if (!removeFavorites([course.id])) return
	toast.success('已取消收藏 1 門下架課程', { description: title })
}

function clearArchivedCourses() {
	const removed = removeFavorites(archived_ids.value)
	if (!removed) return
	toast.success(`已取消收藏 ${removed} 門下架課程`)
}
</script>

<template>
	<LoadingOverlay v-if="loading" text="課表讀取中…" />
	<LoadError v-else-if="load_error" @retry="loadCourseList()" />

	<div class="mt-4 flex w-full flex-1 flex-col">
		<h1 class="sr-only">收藏的課程</h1>
		<div class="mx-auto flex w-full max-w-5xl flex-1 flex-col lg:px-4">
			<div class="sticky top-[var(--nav-h)] z-30 flex items-center gap-2 bg-color-2/90 px-4 py-1.5">
				<TermSelect
					v-model="selected_term_id"
					:term-list="term_list"
					:disabled="loading"
					:note-map="term_note_map"
					trigger-class="h-8 bg-color-1 data-[size=default]:h-8"
				/>

				<ViewModeTabs v-model="view_mode" compact root-class="ml-auto shrink-0" />
			</div>

			<template v-if="loaded">
				<div v-if="archived_ids.length" class="mx-4 mt-1.5 rounded-md border border-amber-500/20 bg-amber-500/5 p-2.5">
					<div class="flex items-center gap-2">
						<TriangleAlert class="size-4 shrink-0 text-amber-600" />
						<div class="min-w-0 flex-1 text-sm font-medium">
							{{ archived_ids.length }} 門收藏的課程已下架
						</div>
						<Button
							variant="ghost"
							size="xs"
							class="-mr-1 text-color-6 hover:text-destructive"
							:disabled="archived_loading"
							@click="archived_dialog_open = true"
						>
							<Trash2 />
							全部移除
						</Button>
					</div>

					<p class="ml-6 text-xs text-color-6">請重新搜尋並收藏，如有疑問請洽開課單位</p>

					<InlineLoading v-if="archived_loading" text="課程資料讀取中…" size="size-6" container-class="mt-2 flex-col py-8" />

					<ul v-else class="mt-2 flex flex-col gap-1">
						<li
							v-for="{ course, title, meta } in archived_rows"
							:key="course.id"
							class="flex items-center gap-2 rounded-md bg-color-1 px-2 py-1.5"
						>
							<div class="min-w-0 flex-1">
								<div v-if="title" class="text-sm font-medium">{{ title }}</div>
								<div v-if="meta" class="text-xs break-words text-color-6">{{ meta }}</div>
							</div>
							<button
								type="button"
								class="shrink-0 p-1 text-color-5 hover:text-destructive"
								:aria-label="title ? `移除 ${title}` : '移除下架課程'"
								@click="removeArchivedCourse(course, title)"
							>
								<X class="size-4" />
							</button>
						</li>
					</ul>
				</div>

				<template v-if="favorite_courses.length">
					<div class="flex items-center gap-2 px-4 pt-1 pb-1.5">
						<div class="min-w-0 truncate text-xs text-color-6">
							{{ favorite_courses.length }} 門課・{{ total_credit }} 學分
						</div>

						<Button
							variant="link"
							size="xs"
							class="-ml-1 px-1 text-color-6 hover:text-color-10 hover:no-underline"
							@click="limit_dialog_open = true"
						>
							<Info />
							學分上下限
						</Button>

						<Button
							v-if="current_term_favorite_count"
							variant="ghost"
							size="xs"
							class="-mr-2 ml-auto text-color-6 hover:text-destructive"
							@click="clear_dialog_open = true"
						>
							<Trash2 />
							清除本學期收藏課程
						</Button>
					</div>

					<div class="mb-4">
						<CourseTable v-if="view_mode === 'table'" :courses="favorite_courses" @alt-click="openAlt($event)" />
						<CourseList v-else :courses="favorite_courses" :conflict-ids="conflict_ids" confirm-remove @alt-click="openAlt($event)" />

						<SponsorAd section-class="mt-4 print:hidden" title-class="px-4" card-class="mx-0 rounded-none md:rounded-none md:border-x-0 lg:mx-3 lg:rounded-lg lg:border-x-3" />
					</div>
				</template>

				<CourseEmpty v-else :title="empty_title" :icon="Star" container-class="h-auto flex-1 px-4 py-20">
					在課程列表點擊 <Star class="inline-block size-3.5 align-middle" /> 就能收藏有興趣的課程！
					<template #extra>
						<RouterLink to="/course" :class="[buttonVariants(), 'mt-2']">前往搜尋課程</RouterLink>
					</template>
				</CourseEmpty>
			</template>
		</div>
	</div>

	<Dialog v-model:open="limit_dialog_open">
		<DialogContent class="max-w-md">
			<DialogHeader>
				<DialogTitle>四技日間部選課學分上下限</DialogTitle>
			</DialogHeader>
			<table class="w-full table-fixed text-sm">
				<thead class="bg-color-3 text-xs text-color-7">
					<tr class="border-b">
						<th rowspan="2" class="px-3 py-2 font-medium">年級</th>
						<th colspan="2" class="px-3 py-2 font-medium">上學期</th>
						<th colspan="2" class="px-3 py-2 font-medium">下學期</th>
					</tr>
					<tr>
						<th class="px-3 py-2 font-medium">下限</th>
						<th class="px-3 py-2 font-medium">上限</th>
						<th class="px-3 py-2 font-medium">下限</th>
						<th class="px-3 py-2 font-medium">上限</th>
					</tr>
				</thead>
				<tbody class="divide-y text-center">
					<tr v-for="row in CREDIT_LIMITS" :key="row[0]">
						<td class="px-3 py-2 font-medium">{{ row[0] }}</td>
						<td class="px-3 py-2 text-color-8">{{ row[1] }}</td>
						<td class="px-3 py-2 text-color-8">{{ row[2] }}</td>
						<td class="px-3 py-2 text-color-8">{{ row[3] }}</td>
						<td class="px-3 py-2 text-color-8">{{ row[4] }}</td>
					</tr>
				</tbody>
			</table>
		</DialogContent>
	</Dialog>

	<ConfirmDialog
		v-model:open="clear_dialog_open"
		:title="`清除 ${selected_term_id} 的 ${current_term_favorite_count} 門收藏課程？`"
		confirm-text="清除"
		confirm-variant="destructive"
		cancel-text="保留"
		@confirm="clearTermFavorite()"
	/>

	<AltCourseDialog ref="alt_dialog" :course-list="course_list" />

	<ConfirmDialog
		v-model:open="archived_dialog_open"
		:title="`移除 ${archived_ids.length} 門已下架的收藏課程？`"
		confirm-text="移除"
		cancel-text="保留"
		@confirm="clearArchivedCourses()"
	/>
</template>
