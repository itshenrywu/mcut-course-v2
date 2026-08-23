<script setup>
import { ref, computed, watch } from 'vue'
import { Star, School, Info } from '@lucide/vue'
import { getCourseList } from '@/api/course'
import { useLatestRequest } from '@/lib/loader'
import { useFavoriteTermCount } from '@/lib/favorite'
import { useFavoriteCourses, formatCourseTimes, FULL_WEEKDAY_LABELS } from '@/lib/course'
import { getStoredTermList, useSelectedTerm } from '@/lib/term'
import { courseToMyCourses, findConflict } from '@/lib/my-course'
import { parseSchoolCourses } from '@/lib/school-import'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import TermSelect from '@/components/TermSelect.vue'
import InlineLoading from '@/components/InlineLoading.vue'
import EmptyHint from '@/components/EmptyHint.vue'

const NO_TIME_REASON = '沒有星期一至五的固定時段，無法匯入'
const BLOCKED_REASONS = {
	drop: '已停修，不匯入',
	exempt: '已抵免學分，不匯入'
}

const PARSE_ERRORS = {
	format: '無法辨識貼上的內容，請確認有複製到整個課表表格（含最上面的標題列）',
	no_course: '這份課表裡沒有可以辨識的課程'
}

const open = defineModel('open', { type: Boolean, default: false })

const props = defineProps({
	courses: {
		type: Array,
		default: () => []
	}
})

const emit = defineEmits(['submit'])

const { selected_term_id } = useSelectedTerm()
const { favorite_count_map, term_note_map } = useFavoriteTermCount()

const import_source = ref('favorite')
const term_id = ref('')
const term_list = ref(getStoredTermList())
const course_list = ref([])
const loading = ref(false)
const load_error = ref(false)
const selected_ids = ref(new Set())
const paste_text = ref('')
const paste_html = ref('')
const paste_html_text = ref('')
const parse_error = ref('')
const school_courses = ref([])
const school_system = ref('info')

const startRequest = useLatestRequest()

const favorite_courses = useFavoriteCourses(course_list)

const favorite_items = computed(() => favorite_courses.value.map(course => {
	const blocks = courseToMyCourses(course)
	return {
		id: course.id,
		name: course.name,
		note: [formatCourseTimes(course) || '無固定時間', course.teacher].filter(Boolean).join('・'),
		blocks,
		reason: blocks.length ? '' : NO_TIME_REASON
	}
}))

const school_items = computed(() => school_courses.value.map(course => {
	const blocks = course.blocked ? [] : courseToMyCourses(course, course.room)
	return {
		id: course.id,
		name: course.name,
		note: [course.time.map(formatSchoolTime).join('、'), course.room].filter(Boolean).join('・'),
		blocks,
		reason: BLOCKED_REASONS[course.blocked] || (blocks.length ? '' : NO_TIME_REASON)
	}
}))

const items = computed(() => import_source.value === 'school' ? school_items.value : favorite_items.value)

const importable_items = computed(() => items.value.filter(item => item.blocks.length))

const list_visible = computed(() => {
	if (!items.value.length) return false
	return import_source.value === 'school' || (!loading.value && !load_error.value)
})

const conflict_map = computed(() => {
	const taken = [...props.courses]
	for (const item of items.value) {
		if (selected_ids.value.has(item.id)) taken.push(...item.blocks)
	}
	const map = new Map()
	for (const item of importable_items.value) {
		if (selected_ids.value.has(item.id)) continue
		for (const block of item.blocks) {
			const conflict = findConflict(taken, block)
			if (!conflict) continue
			map.set(item.id, conflict)
			break
		}
	}
	return map
})

const selected_blocks = computed(() => items.value.filter(item => selected_ids.value.has(item.id)).flatMap(item => item.blocks))

const all_state = computed(() => {
	if (!selected_ids.value.size) return false
	return selected_ids.value.size === importable_items.value.length ? true : 'indeterminate'
})

function formatSchoolTime(time) {
	const label = FULL_WEEKDAY_LABELS[time.day % 7] || ''
	const first = time.section[0]
	const last = time.section[time.section.length - 1]
	const range = first === last ? `${first}` : `${first}~${last}`
	return label ? `(${label}) ${range}` : range
}

function defaultTermId() {
	if (favorite_count_map.value.has(selected_term_id.value)) return selected_term_id.value
	const term_ids = [...favorite_count_map.value.keys()].sort()
	return term_ids[term_ids.length - 1] || selected_term_id.value
}

function resetSelection() {
	const taken = [...props.courses]
	const next = new Set()
	for (const item of importable_items.value) {
		if (item.blocks.some(block => findConflict(taken, block))) continue
		next.add(item.id)
		taken.push(...item.blocks)
	}
	selected_ids.value = next
}

async function loadCourses() {
	const isLatest = startRequest()
	loading.value = true
	load_error.value = false
	try {
		const data = await getCourseList(term_id.value)
		if (!isLatest()) return
		term_list.value = data.term_list
		course_list.value = data.course_list
		resetSelection()
		if (data.term_id !== term_id.value) term_id.value = data.term_id
	} catch (error) {
		if (!isLatest()) return
		console.error(error)
		course_list.value = []
		selected_ids.value = new Set()
		load_error.value = true
	} finally {
		if (isLatest()) loading.value = false
	}
}

function resetSchool() {
	paste_text.value = ''
	paste_html.value = ''
	paste_html_text.value = ''
	parse_error.value = ''
	school_courses.value = []
	selected_ids.value = new Set()
}

function parseSchool() {
	const text = paste_text.value
	if (!text.trim()) {
		resetSchool()
		return
	}
	const { error, courses } = parseSchoolCourses({ text, html: paste_html_text.value === text ? paste_html.value : '' })
	parse_error.value = error ? PARSE_ERRORS[error] || PARSE_ERRORS.format : ''
	school_courses.value = courses
	resetSelection()
}

function pasteSchool(event) {
	const html = event.clipboardData?.getData('text/html') || ''
	const text = event.clipboardData?.getData('text/plain') || ''
	if (!text) return
	event.preventDefault()
	paste_html.value = html
	paste_html_text.value = text
	paste_text.value = text
}

function toggle(item) {
	const next = new Set(selected_ids.value)
	if (!next.delete(item.id)) next.add(item.id)
	selected_ids.value = next
}

function toggleAll() {
	if (selected_ids.value.size) {
		selected_ids.value = new Set()
		return
	}
	resetSelection()
}

function submit() {
	const blocks = selected_blocks.value
	if (!blocks.length) return
	open.value = false
	emit('submit', { blocks, count: selected_ids.value.size, source: import_source.value })
}

watch(open, value => {
	if (!value) return
	import_source.value = 'favorite'
	resetSchool()
	const next = defaultTermId()
	if (next !== term_id.value) term_id.value = next
	else loadCourses()
})

watch(term_id, () => loadCourses())

watch(paste_text, () => parseSchool())

watch(import_source, () => resetSelection())
</script>

<template>
	<Dialog v-model:open="open">
		<DialogContent class="max-w-lg">
			<DialogHeader>
				<DialogTitle>匯入課程</DialogTitle>
			</DialogHeader>

			<div class="flex h-[75dvh] max-h-[36rem] flex-col gap-3">
				<Tabs v-model="import_source" class="shrink-0">
					<TabsList class="bg-color-1 border-color-3 w-full border" aria-label="匯入來源">
						<TabsTrigger value="favorite">
							<Star class="size-4" />
							收藏的課程
						</TabsTrigger>
						<TabsTrigger value="school">
							<School class="size-4" />
							學校系統
						</TabsTrigger>
					</TabsList>
				</Tabs>

				<template v-if="import_source === 'favorite'">
					<TermSelect
						v-model="term_id"
						:term-list="term_list"
						:disabled="loading"
						:note-map="term_note_map"
						trigger-class="w-full bg-color-1"
						class="shrink-0"
					/>

					<p class="text-color-6 mb-2 flex items-start gap-1 text-xs">
						<Info class="mt-px size-3.5 shrink-0" />
						<span>開課資料可能與實際課表有些微差（如老師 / 上課時間），建議等選課結束後再從「學校系統」匯入</span>
					</p>

					<InlineLoading v-if="loading" text="課程資料讀取中…" container-class="flex-1" />

					<div v-else-if="load_error" class="flex flex-1 flex-col items-center justify-center gap-3">
						<p class="text-color-6 text-sm">課程資料讀取失敗</p>
						<Button variant="outline" size="sm" @click="loadCourses()">重試</Button>
					</div>

					<EmptyHint v-else-if="!items.length" class="flex flex-1 items-center justify-center">這個學期沒有收藏的課程</EmptyHint>
				</template>

				<div v-else-if="school_courses.length" class="text-color-6 flex shrink-0 items-center justify-between gap-2 text-xs">
					<span>已辨識出 {{ school_courses.length }} 門課程</span>
					<Button variant="ghost" size="sm" class="-mr-2" @click="resetSchool()">重貼一次</Button>
				</div>

				<div v-else class="-mx-1 flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto overscroll-contain px-1">
					<Select v-model="school_system">
						<SelectTrigger class="bg-color-1 w-full shrink-0" aria-label="課表來源系統">
							<SelectValue />
						</SelectTrigger>
						<SelectContent :side-offset="12">
							<SelectItem value="info">學生資訊查詢系統</SelectItem>
							<SelectItem value="enroll">選課系統</SelectItem>
						</SelectContent>
					</Select>

					<div>
						<template v-if="school_system === 'info'">
							<p class="text-color-6 mb-2 flex items-start gap-1 text-xs">
								<Info class="mt-px size-3.5 shrink-0" />
								<span>「學生資訊查詢系統」在選課結束後幾天才會更新課表資料</span>
							</p>
							<p class="text-color-6 text-xs mb-1">
								操作步驟：
							</p>
							<ol class="text-color-6 marker:text-color-5 list-outside list-decimal space-y-0.5 pl-5 text-xs leading-relaxed marker:tabular-nums">
								<li>使用明志 App 或校園入口網，前往<b class="font-medium">學生資訊查詢系統</b></li>
								<li>點擊選單中的課程查詢 > 課表查詢</li>
								<li>選取整個表格並複製（含最上面的標題列）</li>
								<li>貼到下面的欄位</li>
							</ol>
						</template>
						<template v-else-if="school_system === 'enroll'">
							<p class="text-color-6 mb-2 flex items-start gap-1 text-xs">
								<Info class="mt-px size-3.5 shrink-0" />
								<span>建議等選課結束再使用「學生資訊查詢系統」匯入，才能查看教室位置！</span>
							</p>
							<p class="text-color-6 text-xs mb-1">
								操作步驟：
							</p>
							<ol class="text-color-6 marker:text-color-5 list-outside list-decimal space-y-0.5 pl-5 text-xs leading-relaxed marker:tabular-nums">
								<li>前往<a href="http://day.course.mcut.edu.tw/" rel="noopener noreferrer" target="_blank" class="underline">選課系統</a>並登入</li>
								<li>點擊<b class="font-medium">選課確認</b></li>
								<li>選取整個表格並複製（含最上面的標題列）</li>
								<li>貼到下面的欄位</li>
							</ol>
						</template>
					</div>

					<Textarea
						v-model="paste_text"
						class="bg-color-1 h-24 shrink-0 resize-none"
						placeholder="在這裡貼上複製的課表"
						aria-label="學校系統課表內容"
						@paste="pasteSchool"
					/>

					<p v-if="parse_error" class="text-destructive text-xs">{{ parse_error }}</p>
				</div>

				<template v-if="list_visible">
					<Checkbox
						:model-value="all_state"
						:disabled="!importable_items.length"
						class="border-color-3 shrink-0 border-b px-2 pb-2"
						@update:model-value="toggleAll()"
					>
						<span class="flex items-center justify-between gap-2">
							<span class="font-medium">全選</span>
							<span class="text-color-6 text-xs">已選 {{ selected_ids.size }} / {{ importable_items.length }} 門</span>
						</span>
					</Checkbox>

					<div class="-mx-2 flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto overscroll-contain px-2">
						<Checkbox
							v-for="item in items"
							:key="item.id"
							:model-value="selected_ids.has(item.id)"
							:disabled="!item.blocks.length || conflict_map.has(item.id)"
							class="hover:bg-color-2 items-start rounded-md px-2 py-1.5"
							@update:model-value="toggle(item)"
						>
							<span class="flex min-w-0 flex-col">
								<span class="truncate font-medium">{{ item.name }}</span>
								<span class="text-color-6 truncate text-xs">{{ item.note }}</span>
								<span v-if="item.reason" class="text-color-6 text-xs">{{ item.reason }}</span>
								<span v-else-if="conflict_map.has(item.id)" class="text-xs text-amber-600">與「{{ conflict_map.get(item.id).name }}」衝堂</span>
							</span>
						</Checkbox>
					</div>
				</template>
			</div>

			<DialogFooter class="mt-2 gap-4">
				<Button
					type="button"
					class="flex-1"
					:disabled="!selected_ids.size"
					@click="submit()"
				>
					匯入{{ selected_ids.size ? ` ${selected_ids.size} 門` : '' }}
				</Button>
			</DialogFooter>
		</DialogContent>
	</Dialog>
</template>
