<script setup>
import { computed, ref, useTemplateRef } from 'vue'
import { RouterLink } from 'vue-router'
import { useElementSize, useMediaQuery } from '@vueuse/core'
import { Layers, Clock } from '@lucide/vue'
import { remToPx } from '@/lib/utils'
import { HoverCard, HoverCardTrigger, HoverCardContent } from '@/components/ui/hover-card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import CourseList from '@/components/CourseList.vue'
import CourseListDialog from '@/components/CourseListDialog.vue'
import CourseEmpty from '@/components/CourseEmpty.vue'
import CourseBlock from '@/components/CourseBlock.vue'
import CourseHoverDetail from '@/components/CourseHoverDetail.vue'
import { SECTION_ORDER, SECTION_TIME, WEEKDAY_LABELS, MAX_TABLE_COLS, visibleSections, isAltCourse, isMultiAltCourse, courseOrAltRoutePath, otherClassGroupLabel, peInternationalLabel } from '@/lib/course'

// 節次列高與左側時間欄寬 (rem)
const SECTION_ROW_HEIGHT = 3.5
const TIME_COL_WIDTH = 2

// 單一課程 block 最小可讀寬度 (rem)
const MIN_BLOCK_WIDTH = 1.3

// 課程字級 = block 扣掉內距後的可用寬度 / 每行全形字數, 並夾在上下限 (rem) 之間
const BLOCK_H_INSET = 0.625 // 外層 p-0.25 + 區塊 p-1 的左右內距總和 (rem)
const BLOCK_BORDER = 2 // 區塊左右 border (px)
const CHARS_PER_LINE = 2.1 // 課名一行想塞的全形字數
const FONT_MIN = 0.6
const FONT_MAX = 0.8

const MAX_COLS_FALLBACK = 3

const props = defineProps({
	courses: {
		type: Array,
		default: () => []
	},
	narrowDays: {
		type: Array,
		default: null
	},
	gradeClass: {
		type: String,
		default: 'any'
	},
	filter: {
		type: Object,
		default: () => ({})
	}
})

const emit = defineEmits(['alt-click'])

const grid_ref = useTemplateRef('grid')
const { width: grid_width } = useElementSize(grid_ref)
const overflow_dialog_open = ref(false)
const overflow_dialog_courses = ref([])
const section_dialog_open = ref(false)
const weekdays = computed(() => props.narrowDays || [1, 2, 3, 4, 5])
const max_cols = computed(() => {
	if (grid_width.value <= 0) return MAX_COLS_FALLBACK
	const day_width = (grid_width.value - remToPx(TIME_COL_WIDTH)) / weekdays.value.length
	const min_width = remToPx(MIN_BLOCK_WIDTH)
	return Math.min(MAX_TABLE_COLS, Math.max(1, Math.floor(day_width / min_width)))
})

function altRank(block) {
	return isAltCourse(block.course) ? 0 : 1
}

function assignColumns(blocks) {
	const columns = []
	for (const block of blocks) {
		let placed = false
		for (let i = 0; i < columns.length; i++) {
			if (!columns[i].some(placed_block => placed_block.start <= block.end && block.start <= placed_block.end)) {
				columns[i].push(block)
				placed = true
				break
			}
		}
		if (!placed) columns.push([block])
	}
	columns.sort((a, b) => Math.min(...a.map(altRank)) - Math.min(...b.map(altRank)))
	columns.forEach((column, i) => column.forEach(block => (block.col = i)))
	return columns.length
}

function layoutBlocks(blocks, limit) {
	blocks.sort((a, b) => a.start - b.start || a.end - b.end)
	const items = []
	let cluster = []
	let cluster_end = -1
	const flush = () => {
		const cols = assignColumns(cluster)
		if (cols <= limit) {
			for (const block of cluster) {
				items.push({ type: 'course', course: block.course, start: block.start, end: block.end, col: block.col, cols })
			}
		} else {
			const keep = limit - 1
			const overflow = []
			for (const block of cluster) {
				if (block.col < keep) {
					items.push({ type: 'course', course: block.course, start: block.start, end: block.end, col: block.col, cols: limit })
				} else {
					overflow.push(block)
				}
			}
			items.push({
				type: 'overflow',
				courses: [...new Map(cluster.map(block => [block.course.id, block.course])).values()],
				overflow_count: overflow.length,
				start: Math.min(...overflow.map(block => block.start)),
				end: Math.max(...overflow.map(block => block.end)),
				col: keep,
				cols: limit
			})
		}
		cluster = []
	}
	for (const block of blocks) {
		if (cluster.length && block.start > cluster_end) flush()
		cluster.push(block)
		cluster_end = Math.max(cluster_end, block.end)
	}
	if (cluster.length) flush()
	return items
}

const visible_sections = computed(() => visibleSections(
	props.courses.flatMap(course => (course.time || [])
		.filter(time => time.day >= 1 && time.day <= 5)
		.map(time => time.section))
))

const day_columns = computed(() => {
	const days = weekdays.value
	const day_index = new Map(days.map((day, i) => [day, i]))
	const cols = days.map(day => ({ day, blocks: [] }))
	for (const course of props.courses) {
		for (const time of course.time || []) {
			if (!day_index.has(time.day)) continue
			const indices = time.section.map(section => visible_sections.value.indexOf(section)).filter(i => i >= 0)
			if (!indices.length) continue
			cols[day_index.get(time.day)].blocks.push({
				course,
				start: Math.min(...indices),
				end: Math.max(...indices)
			})
		}
	}
	return cols.map(col => ({ day: col.day, items: layoutBlocks(col.blocks, max_cols.value) }))
})

const block_font_size = computed(() => {
	if (grid_width.value <= 0) return null
	const day_width = (grid_width.value - remToPx(TIME_COL_WIDTH)) / weekdays.value.length
	const max_used_cols = Math.max(1, ...day_columns.value.flatMap(col => col.items.map(item => item.cols)))
	const text_width = day_width / max_used_cols - remToPx(BLOCK_H_INSET) - BLOCK_BORDER
	const size = text_width / CHARS_PER_LINE
	return `${Math.min(remToPx(FONT_MAX), Math.max(remToPx(FONT_MIN), size)).toFixed(1)}px`
})

function classGroupLabel(course) {
	return otherClassGroupLabel(course, props.gradeClass)
}

function internationalLabel(course) {
	return peInternationalLabel(course, props.filter.dept, props.filter.grade_class)
}

const unscheduled = computed(() =>
	props.courses.filter(course => !(course.time || []).some(time => time.day >= 1 && time.day <= 5))
)

function openOverflow(item) {
	overflow_dialog_courses.value = item.courses
	overflow_dialog_open.value = true
}

function overflowCourseClick(course) {
	overflow_dialog_open.value = false
	if (isMultiAltCourse(course)) emit('alt-click', course)
}

function blockStyle(item) {
	const total = visible_sections.value.length
	const width = 100 / item.cols
	return {
		top: `${(item.start / total) * 100}%`,
		height: `${((item.end - item.start + 1) / total) * 100}%`,
		left: `${item.col * width}%`,
		width: `${width}%`
	}
}
</script>

<template>
	<CourseEmpty v-if="courses.length === 0" />
	<div v-else>
		<div
			ref="grid"
			class="grid overflow-hidden border-t border-l bg-color-1 mt-4 lg:rounded-lg lg:mx-3"
			:style="{ gridTemplateColumns: `${TIME_COL_WIDTH}rem repeat(${weekdays.length}, minmax(0, 1fr))` }"
		>
			<button
				type="button"
				class="bg-color-2 text-color-5 hover:text-color-8 flex cursor-pointer items-center justify-center border-r border-b"
				aria-label="節次時間說明"
				@click="section_dialog_open = true"
			>
				<Clock class="size-4" />
			</button>
			<div
				v-for="day in weekdays"
				:key="day"
				class="bg-color-2 text-color-9 border-r border-b py-2 text-center text-sm font-medium"
			>
				{{ WEEKDAY_LABELS[day] }}
			</div>

			<div class="bg-color-2 flex flex-col border-r">
				<div
					v-for="section in visible_sections"
					:key="section"
					class="text-color-6 flex items-center justify-center border-b text-xs"
					:style="{ height: `${SECTION_ROW_HEIGHT}rem` }"
				>
					{{ section }}
				</div>
			</div>

			<div v-for="col in day_columns" :key="col.day" class="relative border-r">
				<div class="absolute inset-0 flex flex-col">
					<div v-for="section in visible_sections" :key="section" class="border-b" :style="{ height: `${SECTION_ROW_HEIGHT}rem` }"></div>
				</div>

				<template v-for="item in col.items" :key="`${item.type}-${item.course?.id ?? ''}-${item.start}-${item.col}`">
					<button
						v-if="item.type === 'course' && isMultiAltCourse(item.course)"
						type="button"
						class="absolute p-0.25 text-left"
						:style="blockStyle(item)"
						@click="emit('alt-click', item.course)"
					>
						<CourseBlock :course="item.course" fill :style="block_font_size && { fontSize: block_font_size }" />
					</button>

					<HoverCard v-else-if="item.type === 'course'" :open-delay="150" :close-delay="100">
						<HoverCardTrigger as-child>
							<RouterLink
								:to="courseOrAltRoutePath(item.course)"
								class="absolute p-0.25 text-left"
								:style="blockStyle(item)"
							>
								<CourseBlock
									:course="item.course"
									fill
									:class-group="classGroupLabel(item.course)"
									:international-label="internationalLabel(item.course)"
									:style="block_font_size && { fontSize: block_font_size }"
								/>
							</RouterLink>
						</HoverCardTrigger>
						<HoverCardContent align="start" class="w-72 text-sm">
							<CourseHoverDetail :course="item.course" />
						</HoverCardContent>
					</HoverCard>

					<button v-else type="button" class="absolute p-0.5" :style="blockStyle(item)" :aria-label="`此時段共 ${item.courses.length} 門課`" @click="openOverflow(item)">
						<div class="bg-color-2 text-color-9 flex h-full w-full cursor-pointer flex-col items-center justify-center gap-0.5 rounded-md border" :style="block_font_size && { fontSize: block_font_size }">
							<Layers class="size-3 opacity-70" />
							<span class="text-[.55rem] font-medium">
								{{ item.overflow_count }}+
							</span>
						</div>
					</button>
				</template>
			</div>
		</div>

		<CourseListDialog v-model:open="overflow_dialog_open" title="此時段的課程" :count="overflow_dialog_courses.length" list-class="overscroll-contain">
			<CourseBlock
				v-for="course in overflow_dialog_courses"
				:key="course.id"
				:course="course"
				:time="true"
				:class-group="classGroupLabel(course)"
				:international-label="internationalLabel(course)"
				:as="isMultiAltCourse(course) ? 'button' : RouterLink"
				:to="isMultiAltCourse(course) ? undefined : courseOrAltRoutePath(course)"
				:type="isMultiAltCourse(course) ? 'button' : undefined"
				class="shrink-0 p-2 text-sm"
				@click="overflowCourseClick(course)"
			/>
		</CourseListDialog>

		<Dialog v-model:open="section_dialog_open">
			<DialogContent class="max-w-xs">
				<DialogHeader>
					<DialogTitle>各節次對應上課時間</DialogTitle>
				</DialogHeader>
				<div class="flex max-h-[60dvh] flex-col overflow-y-auto overscroll-contain text-sm">
					<div
						v-for="section in SECTION_ORDER"
						:key="section"
						class="border-color-3 flex items-center justify-between gap-4 border-b py-1.5 last:border-b-0"
					>
						<span class="text-color-9 font-num w-8 shrink-0 font-medium tabular-nums">{{ section }}</span>
						<span class="text-color-6 font-num tabular-nums">{{ SECTION_TIME[section][0] }} ~ {{ SECTION_TIME[section][1] }}</span>
					</div>
				</div>
			</DialogContent>
		</Dialog>

		<div v-if="unscheduled.length" class="mt-6">
			<div class="text-color-6 mb-2 text-sm font-medium mx-3">無固定星期課程</div>
			<CourseList :courses="unscheduled" embedded @alt-click="emit('alt-click', $event)" />
		</div>
	</div>
</template>
