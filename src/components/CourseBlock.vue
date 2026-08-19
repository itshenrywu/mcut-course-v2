<script setup>
import { computed } from 'vue'
import { Primitive } from 'reka-ui'
import { ChevronRight } from '@lucide/vue'
import { cn } from '@/lib/utils'
import { ENROLL_TYPE_TABLE_CLASSES, isMultiAltCourse } from '@/lib/course'
import { formatCourseTimes, peCourseItem } from '@/lib/course-format'

const props = defineProps({
	course: { type: Object, required: true },
	as: { type: null, default: 'div' },
	fill: { type: Boolean, default: false },
	class: { type: null, default: '' },
	time: { type: Boolean, default: false },
	classGroup: { type: String, default: '' },
	internationalLabel: { type: String, default: '' }
})

const is_multi_alt = computed(() => isMultiAltCourse(props.course))

const normalizedCourseName = computed(() => {
	return peCourseItem(props.course) || props.course.name || ''
})
</script>

<template>
	<Primitive
		:as="as"
		:class="cn(
			'relative flex flex-col overflow-hidden rounded-md border p-1 text-left text-[.75rem]',
			ENROLL_TYPE_TABLE_CLASSES[course.enroll_type] || ENROLL_TYPE_TABLE_CLASSES.DEFAULT,
			fill && 'h-full w-full',
			props.class
		)"
	>
		<div class="leading-tight font-medium" :class="fill && 'min-h-0 overflow-hidden'">{{ normalizedCourseName }}</div>
		<div v-if="time" class="text-[90%] opacity-70" :class="fill ? 'mt-auto shrink-0 overflow-hidden whitespace-nowrap' : 'truncate'">
			{{ formatCourseTimes(course) }}
		</div>
		<div v-if="!is_multi_alt" class="text-[90%] leading-tight opacity-70" :class="fill && 'mt-auto shrink-0'">
			<div v-if="classGroup" :class="fill ? 'overflow-hidden whitespace-nowrap' : 'truncate'">{{ classGroup }}</div>
			<div v-if="internationalLabel" :class="fill ? 'overflow-hidden whitespace-nowrap' : 'truncate'">{{ internationalLabel }}</div>
			<div :class="fill ? 'overflow-hidden whitespace-nowrap' : 'truncate'">{{ course.teacher }}</div>
		</div>
		<ChevronRight v-if="is_multi_alt" class="absolute right-0.5 bottom-0.5 size-3 opacity-70" />
	</Primitive>
</template>
