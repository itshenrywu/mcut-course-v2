<script setup>
import { UsersRound, BookCheck, Info, Clock } from '@lucide/vue'
import TeacherIcon from '@/components/icons/TeacherIcon.vue'
import CourseBadges from '@/components/CourseBadges.vue'
import { formatCourseTimes, formatDeptClass, hasRemark } from '@/lib/course'

defineProps({
	course: {
		type: Object,
		required: true
	}
})
</script>

<template>
	<div class="mb-2 text-sm leading-tight font-medium">{{ course.name }}</div>
	<div class="mb-2 flex flex-wrap items-center gap-1 text-xs">
		<CourseBadges :course="course" />
	</div>
	<div class="flex flex-col gap-1.5 text-xs">
		<div class="flex items-center gap-2">
			<UsersRound class="size-3 shrink-0 text-color-5" />
			<span class="text-color-9">{{ formatDeptClass(course) || '—' }}</span>
		</div>
		<div v-if="course.teacher" class="flex items-center gap-2">
			<TeacherIcon class="size-3 shrink-0 text-color-5" />
			<span class="text-color-9">{{ course.teacher }}</span>
		</div>
		<div class="flex items-center gap-2">
			<BookCheck class="size-3 shrink-0 text-color-5" />
			<span class="font-num text-color-9 tabular-nums">{{ course.credit }} 學分</span>
		</div>
		<div v-if="course.time?.length" class="flex items-start gap-2">
			<Clock class="size-3 h-[1lh] shrink-0 text-color-5" />
			<span class="text-color-9">{{ formatCourseTimes(course) }}</span>
		</div>
		<div v-if="hasRemark(course)" class="flex items-start gap-2">
			<Info class="size-3 h-[1lh] shrink-0 text-color-5" />
			<span class="text-color-9">{{ course.remark }}</span>
		</div>
	</div>
</template>
