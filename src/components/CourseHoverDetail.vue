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
	<div class="mb-2 text-sm leading-tight font-medium">{{ course.name }} <span class="text-xs font-normal text-color-6">{{ course.teacher }}</span></div>
	<div class="mb-2 flex flex-wrap items-center gap-1 text-xs">
		<CourseBadges :course="course" credit-class="text-color-9" />
	</div>
	<div class="flex flex-col gap-1.5 text-xs">
		<div class="flex items-center gap-2">
			<Users class="size-3 shrink-0 text-color-5" />
			<span class="text-color-9">{{ formatDeptClass(course) || '—' }}</span>
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
