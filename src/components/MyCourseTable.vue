<script setup>
import { ref, computed, watchEffect, useTemplateRef } from 'vue'
import { useElementSize, useDevicePixelRatio, useMediaQuery } from '@vueuse/core'
import { layoutTimetable, drawTimetable, hitTimetable, BASE_WIDTH, BASE_HEIGHT, EXPORT_WIDTH } from '@/lib/my-course-canvas'

const props = defineProps({
	courses: {
		type: Array,
		default: () => []
	},
	settings: {
		type: Object,
		required: true
	},
	background: {
		type: Object,
		default: null
	},
	fit: {
		type: Boolean,
		default: false
	}
})

const emit = defineEmits(['course-click', 'empty-click'])

const wrap_ref = useTemplateRef('wrap')
const canvas_ref = useTemplateRef('canvas')

const { width: wrap_width, height: wrap_height } = useElementSize(wrap_ref)
const { pixelRatio } = useDevicePixelRatio()
const is_desktop = useMediaQuery('(min-width: 64rem)')

const layout = computed(() => layoutTimetable(props.courses, props.settings))

const fit_height = computed(() => props.fit || is_desktop.value)

const css_width = computed(() => {
	if (wrap_width.value <= 0) return 0
	if (!fit_height.value) return wrap_width.value
	return Math.floor(Math.min(wrap_width.value, (wrap_height.value * BASE_WIDTH) / BASE_HEIGHT))
})
const css_height = computed(() => (css_width.value * BASE_HEIGHT) / BASE_WIDTH)
const overflowing = computed(() => css_height.value > wrap_height.value)
const canvas_style = computed(() => ({
	width: `${css_width.value}px`,
	height: `${css_height.value}px`
}))

const hovering = ref(false)

watchEffect(() => {
	const canvas = canvas_ref.value
	if (!canvas || css_width.value <= 0) return
	drawTimetable(canvas, layout.value, { style: props.settings, background: props.background, css_width: css_width.value, pixel_ratio: pixelRatio.value })
})

function pointAt(event) {
	const rect = canvas_ref.value.getBoundingClientRect()
	if (!rect.width || !rect.height) return null
	return {
		x: ((event.clientX - rect.left) / rect.width) * BASE_WIDTH,
		y: ((event.clientY - rect.top) / rect.height) * BASE_HEIGHT
	}
}

function onClick(event) {
	const point = pointAt(event)
	if (!point) return
	const hit = hitTimetable(layout.value, point.x, point.y)
	if (!hit) return
	if (hit.type === 'course') emit('course-click', hit.course)
	else emit('empty-click', { day: hit.day, section: hit.section })
}

function onMove(event) {
	const point = pointAt(event)
	hovering.value = Boolean(point && hitTimetable(layout.value, point.x, point.y))
}

function renderImage() {
	return new Promise((resolve, reject) => {
		const canvas = document.createElement('canvas')
		drawTimetable(canvas, layout.value, { style: props.settings, background: props.background, css_width: EXPORT_WIDTH })
		canvas.toBlob(blob => {
			if (!blob) {
				reject(new Error('canvas toBlob failed'))
				return
			}
			resolve(blob)
		}, 'image/png')
	})
}

defineExpose({ renderImage })
</script>

<template>
	<div ref="wrap" class="relative w-full overflow-y-auto overscroll-contain">
		<canvas
			ref="canvas"
			class="absolute left-1/2 block -translate-x-1/2 select-none lg:rounded-lg"
			:class="[hovering ? 'cursor-pointer' : 'cursor-default', overflowing ? 'top-0' : 'top-1/2 -translate-y-1/2']"
			:style="canvas_style"
			@click="onClick"
			@mousemove="onMove"
			@mouseleave="hovering = false"
		></canvas>
	</div>
</template>
