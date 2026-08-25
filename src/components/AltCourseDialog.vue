<script>
import { ref as altDialogRef } from 'vue'

export function useAltCourseDialog() {
	const alt_dialog = altDialogRef(null)
	function openAlt(course) {
		alt_dialog.value?.openAlt(course)
	}
	return { alt_dialog, openAlt }
}
</script>

<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { Info } from '@lucide/vue'
import { altCourseIds, courseRoutePath, formatCourseTimes, favoriteCourseId, conflictingCourses } from '@/lib/course'
import { useFavorite } from '@/lib/favorite'
import CourseListDialog from '@/components/CourseListDialog.vue'
import CourseRow from '@/components/CourseRow.vue'
import CourseBadges from '@/components/CourseBadges.vue'
import FavoriteStar from '@/components/FavoriteStar.vue'

const props = defineProps({
	courseList: {
		type: Array,
		default: () => []
	}
})

const router = useRouter()
const { isFavorite } = useFavorite()

const dialog_open = ref(false)
const alt_course = ref(null)
const alt_course_info = ref([])

const favorite_courses = computed(() => props.courseList.filter(course => isFavorite(favoriteCourseId(course))))

function hasConflict(course) {
	return conflictingCourses(course, favorite_courses.value).length > 0
}

const alt_conflict = computed(() => hasConflict(alt_course.value))

const conflict_ids = computed(() => {
	const ids = new Set()
	for (const course of alt_course_info.value) if (hasConflict(course)) ids.add(course.id)
	return ids
})

function openAlt(course) {
	const ids = altCourseIds(course)
	if (ids.length === 1) {
		router.push(courseRoutePath(ids[0]))
		return
	}
	alt_course.value = course
	alt_course_info.value = ids
		.map(id => props.courseList.find(item => item.id === id))
		.filter(Boolean)
	dialog_open.value = true
}

defineExpose({ openAlt })
</script>

<template>
	<CourseListDialog v-if="alt_course" v-model:open="dialog_open" :title="alt_course.name" :count="alt_course_info.length">
		<template #title-extra>
			<FavoriteStar class="-m-1 p-1" :course="alt_course" :conflict="alt_conflict" />
		</template>
		<template #description>
			<CourseBadges :course="alt_course" :general-type="false">
				<span>{{ formatCourseTimes(alt_course) }}</span>
			</CourseBadges>
		</template>
		<CourseRow
			v-for="course in alt_course_info"
			:key="course.id"
			:course="course"
			favorite
			:conflict="conflict_ids.has(course.id)"
			@click="dialog_open = false"
		>
			<template #meta>
				<span class="flex w-full items-start gap-1">
					<Info class="size-3.5 h-[1lh] shrink-0 text-color-5" />
					<span class="min-w-0 flex-1 break-words">{{ course.remark }}</span>
				</span>
			</template>
		</CourseRow>
	</CourseListDialog>
</template>
