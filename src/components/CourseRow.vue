<script setup>
import { RouterLink } from 'vue-router'
import { courseRoutePath } from '@/lib/course'
import FavoriteStar from '@/components/FavoriteStar.vue'

defineProps({
	course: {
		type: Object,
		required: true
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
</script>

<template>
	<div class="relative">
		<RouterLink
			:to="courseRoutePath(course.id)"
			:target="target_blank ? '_blank' : undefined"
			:rel="target_blank ? 'noopener noreferrer' : undefined"
			class="hover:bg-color-2 flex flex-col gap-1 rounded-md px-2 py-2"
			:class="favorite && 'pr-10'"
		>
			<span class="font-medium">
				{{ course.name }} <span class="text-color-6 font-normal text-sm">{{ course.teacher }} 老師</span>
			</span>
			<div class="text-color-6 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs">
				<slot name="meta" />
			</div>
		</RouterLink>
		<FavoriteStar
			v-if="favorite"
			class="absolute inset-y-0 right-0 flex items-center px-3"
			:course="course"
			:conflict="conflict"
			@add="$emit('add', course)"
		/>
	</div>
</template>
