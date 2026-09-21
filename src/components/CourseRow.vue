<script setup>
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { Clock, Info, Users } from '@lucide/vue'
import { courseRoutePath, formatCourseTimes, formatDeptClass, hasRemark } from '@/lib/course'
import TeacherIcon from '@/components/icons/TeacherIcon.vue'
import CourseBadges from '@/components/CourseBadges.vue'
import FavoriteStar from '@/components/FavoriteStar.vue'

const props = defineProps({
	course: {
		type: Object,
		required: true
	},
	fields: {
		type: Array,
		default: () => []
	},
	target_blank: {
		type: Boolean,
		default: false
	},
	favorite: {
		type: Boolean,
		default: false
	},
	conflict: {
		type: Boolean,
		default: false
	}
})

defineEmits(['add'])

const shown = computed(() => new Set(props.fields))
</script>

<template>
	<div class="relative">
		<RouterLink
			:to="courseRoutePath(course.id)"
			:target="target_blank ? '_blank' : undefined"
			:rel="target_blank ? 'noopener noreferrer' : undefined"
			class="flex flex-col gap-0.5 rounded-md px-2 py-2 hover:bg-color-2"
			:class="favorite && 'pr-10'"
		>
			<span class="font-medium">{{ course.name }}</span>
			<div class="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-color-6">
				<span v-if="shown.has('badges')" class="flex w-full flex-wrap items-center gap-x-3 gap-y-0.5">
					<CourseBadges :course="course" :general-type="false" />
				</span>
				<span v-if="shown.has('dept')" class="flex items-center gap-1">
					<Users class="size-3.5 shrink-0 text-color-5" />
					{{ formatDeptClass(course) }}
				</span>
				<span v-if="shown.has('teacher') && course.teacher" class="flex items-center gap-1">
					<TeacherIcon class="size-3.5 shrink-0 text-color-5" />
					{{ course.teacher }}
				</span>
				<span v-if="shown.has('time')" class="flex items-center gap-1">
					<Clock class="size-3.5 shrink-0 text-color-5" />
					{{ formatCourseTimes(course) }}
				</span>
				<span v-if="shown.has('remark') && hasRemark(course)" class="flex items-start gap-1">
					<Info class="size-3.5 h-[1lh] shrink-0 text-color-5" />
					<span class="min-w-0 flex-1 break-words">{{ course.remark }}</span>
				</span>
			</div>
		</RouterLink>
		<FavoriteStar
			v-if="favorite"
			class="absolute top-0 right-0 flex p-3"
			:course="course"
			:conflict="conflict"
			@add="$emit('add', course)"
		/>
	</div>
</template>
