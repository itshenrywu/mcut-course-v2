<script setup>
import { Users, Info, Clock } from '@lucide/vue'
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
	<div class="mb-2 leading-tight font-medium text-sm">{{ course.name }} <span class="text-color-6 font-normal text-xs">{{ course.teacher }}</span></div>
	<div class="mb-2 flex flex-wrap items-center gap-1 text-xs">
		<CourseBadges :course="course" credit-class="text-color-9" />
	</div>
	<div class="flex flex-col gap-1.5 text-xs">
		<div class="flex items-center gap-2">
			<Users class="text-color-5 size-3 shrink-0" />
			<span class="text-color-9">{{ formatDeptClass(course) || '—' }}</span>
		</div>
		<div v-if="course.time?.length" class="flex gap-2">
			<Clock class="text-color-5 mt-0.5 size-3 shrink-0" />
			<span class="text-color-9">{{ formatCourseTimes(course) }}</span>
		</div>
		<div v-if="hasRemark(course)" class="flex gap-2">
			<Info class="text-color-5 mt-0.5 size-3 shrink-0" />
			<span class="text-color-9">{{ course.remark }}</span>
		</div>
	</div>
</template>
