<script setup>
import { computed, ref, watch, onUnmounted } from 'vue'
import { RouterLink } from 'vue-router'
import { Users, Clock, Info } from '@lucide/vue'
import TeacherIcon from '@/components/icons/TeacherIcon.vue'
import ConfirmDialog from '@/components/ConfirmDialog.vue'
import FavoriteStar from '@/components/FavoriteStar.vue'
import { useFavoriteToggle } from '@/lib/favorite'
import CourseEmpty from '@/components/CourseEmpty.vue'
import EnrollBadge from '@/components/EnrollBadge.vue'
import { formatCourseTime, formatDeptClass, hasRemark, isMultiAltCourse, courseOrAltRoutePath } from '@/lib/course'

// 首次渲染的列數上限, 超過的列在瀏覽器 idle 時一次補齊 (避免欄寬隨分批多次跳動)
const RENDER_CHUNK = 100

const emit = defineEmits(['alt-click'])

const { toggleCourseFavorite } = useFavoriteToggle()

const remove_dialog_open = ref(false)
const remove_dialog_course = ref(null)

function askRemoveFavorite(course) {
	remove_dialog_course.value = course
	remove_dialog_open.value = true
}

function confirmRemoveFavorite() {
	toggleCourseFavorite(remove_dialog_course.value)
}

function splitTeacher(teacher) {
	if (!teacher) return []
	return teacher.split('/').map(name => name.trim()).filter(Boolean)
}

const props = defineProps({
	courses: {
		type: Array,
		default: () => []
	},
	conflictIds: {
		type: Set,
		default: () => new Set()
	},
	embedded: {
		type: Boolean,
		default: false
	},
	confirmRemove: {
		type: Boolean,
		default: false
	}
})

const rows = computed(() => props.courses.map(course => {
	const is_multi_alt = isMultiAltCourse(course)
	return {
		course,
		is_multi_alt,
		to: is_multi_alt ? undefined : courseOrAltRoutePath(course),
		dept_class: formatDeptClass(course),
		times: (course.time || []).map(time => formatCourseTime(time, course)),
		enroll_label: course.general_type ? `通識 ${course.general_type.slice(0, 2)}` : course.enroll_type,
		teachers: splitTeacher(course.teacher),
		remark: hasRemark(course) ? course.remark : ''
	}
}))

const visible_count = ref(RENDER_CHUNK)
const visible_rows = computed(() => rows.value.length <= visible_count.value ? rows.value : rows.value.slice(0, visible_count.value))
let idle_id = 0

function cancelIdleFill() {
	if (!idle_id) return
	if (window.cancelIdleCallback) cancelIdleCallback(idle_id)
	else clearTimeout(idle_id)
	idle_id = 0
}

function scheduleIdleFill() {
	cancelIdleFill()
	if (visible_count.value >= props.courses.length) return
	const fill = () => {
		idle_id = 0
		visible_count.value = props.courses.length
	}
	idle_id = window.requestIdleCallback ? requestIdleCallback(fill) : setTimeout(fill, 50)
}

watch(() => props.courses, () => {
	visible_count.value = RENDER_CHUNK
	scheduleIdleFill()
}, { immediate: true })

onUnmounted(cancelIdleFill)

const header_class = computed(() => props.embedded ? '' : 'md:sticky md:top-[calc(var(--nav-h)+2.25rem)] md:z-10')
</script>

<template>
	<CourseEmpty v-if="courses.length === 0" />
	<div v-else class="flex w-full flex-col text-sm md:grid md:grid-cols-[3fr_4fr_5rem_2fr_6rem_3fr_2.5rem_0.75rem] [&>*:last-child]:border-b-0">
		<div class="text-color-6 bg-color-2 hidden border-b text-sm font-medium md:col-span-full md:grid md:grid-cols-subgrid" :class="header_class">
			<div class="px-3 py-2">開課班級</div>
			<div class="px-3 py-2">課程名稱</div>
			<div class="px-3 py-2">上課時間</div>
			<div class="px-3 py-2">修別/學分</div>
			<div class="px-3 py-2">授課老師</div>
			<div class="px-3 py-2">備註</div>
			<div class="px-3 py-2"></div>
		</div>
		<component
			:is="row.is_multi_alt ? 'button' : RouterLink"
			v-for="row in visible_rows"
			:key="row.course.id"
			v-memo="[row, conflictIds.has(row.course.id), embedded, confirmRemove]"
			:to="row.to"
			:type="row.is_multi_alt ? 'button' : undefined"
			class="cursor-pointer hover:bg-color-3 relative flex w-full flex-wrap items-start gap-y-1 border-b py-2 text-left md:col-span-full md:grid md:grid-cols-subgrid md:gap-0 md:p-0 px-3"
			@click="row.is_multi_alt && emit('alt-click', row.course)"
		>
			<div class="order-4 flex items-center gap-1 pr-4 whitespace-nowrap md:order-none md:block md:py-2 md:pr-3 md:pl-3">
				<Users class="text-color-5 size-3.5 shrink-0 md:hidden" />{{ row.dept_class }}
			</div>
			<div class="order-1 flex-1 pr-2 font-medium md:order-none md:flex-none md:px-3 md:py-2">{{ row.course.name }}</div>
			<div class="order-6 flex w-full items-start gap-1 md:order-none md:block md:w-auto md:px-3 md:py-2">
				<Clock class="text-color-5 mt-0.5 size-3.5 shrink-0 md:hidden" />
				<div class="flex flex-wrap md:flex-col">
					<span v-for="(time, index) in row.times" :key="index" class="whitespace-nowrap">
						<span v-if="index > 0" class="md:hidden">、</span>{{ time }}
					</span>
				</div>
			</div>
			<div class="order-2 shrink-0 md:order-none md:px-3 md:py-2 md:whitespace-nowrap">
				<div class="flex items-center gap-2 whitespace-nowrap">
					<EnrollBadge :type="row.course.enroll_type">{{ row.enroll_label }}</EnrollBadge>
					<span>{{ row.course.credit }} 學分</span>
				</div>
			</div>
			<div class="order-3 w-full md:hidden" aria-hidden="true"></div>
			<div class="order-5 flex items-center gap-1 whitespace-nowrap md:order-none md:block md:px-3 md:py-2">
				<TeacherIcon class="text-color-5 size-3.5 shrink-0 md:hidden" />
				<span v-for="(teacher, index) in row.teachers" :key="index" class="md:block">
					<span v-if="index > 0" class="md:hidden"> / </span>{{ teacher }}
				</span>
			</div>
			<div v-if="row.remark" class="order-7 flex w-full items-start gap-1 md:order-none md:block md:w-auto md:px-3 md:py-2">
				<Info class="text-color-5 mt-0.5 size-3.5 shrink-0 md:hidden" />{{ row.remark }}
			</div>
			<FavoriteStar
				v-if="!embedded"
				class="absolute bottom-0 right-0 flex items-center justify-center md:static md:col-start-7 md:right-auto md:bottom-auto px-3 py-2 print:hidden"
				:course="row.course"
				:conflict="conflictIds.has(row.course.id)"
				:confirm-remove="confirmRemove"
				@confirm-remove="askRemoveFavorite(row.course)"
			/>
		</component>
	</div>

	<ConfirmDialog
		v-if="confirmRemove"
		v-model:open="remove_dialog_open"
		:title="`取消收藏「${remove_dialog_course?.name}」？`"
		confirm-text="取消收藏"
		cancel-text="保留"
		@confirm="confirmRemoveFavorite()"
	/>
</template>
