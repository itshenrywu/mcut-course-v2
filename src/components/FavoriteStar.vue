<script setup>
import { computed } from 'vue'
import { Star, TriangleAlert } from '@lucide/vue'
import { useFavoriteToggle } from '@/lib/favorite'

const SIZE_CLASSES = {
	sm: { star: 'size-4', alert: 'size-3.5 -top-2 -right-2' },
	lg: { star: 'size-8', alert: 'size-4 -top-1.5 -right-1.5' }
}

const props = defineProps({
	course: {
		type: Object,
		default: null
	},
	conflict: {
		type: Boolean,
		default: false
	},
	size: {
		type: String,
		default: 'sm'
	},
	confirmRemove: {
		type: Boolean,
		default: false
	}
})

const emit = defineEmits(['confirm-remove', 'add'])

const { isCourseFavorite, favoriteLabel, toggleCourseFavorite } = useFavoriteToggle()

const size_classes = computed(() => SIZE_CLASSES[props.size] || SIZE_CLASSES.sm)
const is_favorite = computed(() => isCourseFavorite(props.course))
const label = computed(() => favoriteLabel(props.course, props.conflict))

function onClick() {
	if (props.confirmRemove && is_favorite.value) return emit('confirm-remove', props.course)
	const added = !is_favorite.value
	toggleCourseFavorite(props.course)
	if (added) emit('add', props.course)
}
</script>

<template>
	<button
		type="button"
		:aria-label="label"
		@click.stop.prevent="onClick()"
	>
		<span class="relative inline-flex">
			<Star :class="[size_classes.star, is_favorite ? 'fill-amber-400 text-amber-400' : 'text-color-5 hover:text-color-7']" />
			<TriangleAlert
				v-if="conflict"
				class="absolute text-red-500"
				:class="size_classes.alert"
				aria-label="與已收藏課程衝堂"
			>
				<title>與已收藏課程衝堂</title>
			</TriangleAlert>
		</span>
	</button>
</template>
