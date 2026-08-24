<script setup>
import { ref, computed, watch } from 'vue'
import { isDayBachelorDept } from '@/lib/dept'
import { useSearchHistory } from '@/lib/search-history'
import TermSelect from '@/components/TermSelect.vue'
import FilterField from '@/components/FilterField.vue'
import SelectFilterField from '@/components/SelectFilterField.vue'
import SearchHistory from '@/components/SearchHistory.vue'
import { formatMixed, canShowMixedGrade, collectGradeInfo, isAltCourse } from '@/lib/course'
import { Input } from '@/components/ui/input'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectGroup, SelectLabel, SelectItem } from '@/components/ui/select'
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Info, TriangleAlert, X } from '@lucide/vue'

// 系所分組顯示順序
const DEPT_GROUPS = ['全校', '四技日間部', '學院', '碩士/碩專/博士/在職專班', '進修部']

// 開課班級備註: 系所 -> `${grade}${class_group}` -> 說明, 值為陣列表示依 term 取用
const CLASS_GROUP_NOTES = {
	'通識中心四技': {
		'1甲': '大一/二/四可修',
		'1乙': '隨課 X+1',
		'1重': '校共同課程重修',
		'1丙': '自主學習',
		'2甲': '選修軍訓',
		'3甲': ['', '大三前暑期', '實習期間'],
		'3乙': '大三前暑期',
		'4乙': '大四',
		'4重': '校共同課程重修',
		'4暑': '暑修'
	},
	'體育組-四技(日)': {
		'1甲': '國際專班',
		'2甲': '大二/四自選體育及國際專班'
	},
	'外文組-四技(日)': {
		'1甲': '大一英文',
		'1乙': '國際專班',
		'2甲': '大二英文',
		'2乙': '國際專班',
		'2丙': '榮譽學程',
		'4甲': '英文實務',
		'4重': '重修'
	}
}

const CONFLICT_MODE_OPTIONS = [
	{ value: 'show', label: '顯示' },
	{ value: 'bottom', label: '置底' },
	{ value: 'hide', label: '隱藏' }
]

const props = defineProps({
	termList: {
		type: Array,
		default: () => []
	},
	courseList: {
		type: Array,
		default: () => []
	},
	disabled: {
		type: Boolean,
		default: false
	}
})

const term_id = defineModel('termId', { type: String, default: '' })
const keyword = defineModel('keyword', { type: String, default: '' })
const dept = defineModel('dept', { type: String, default: 'any' })
const grade_class = defineModel('gradeClass', { type: String, default: 'any' })
const enroll_type = defineModel('enrollType', { type: String, default: 'any' })
const conflict_mode = defineModel('conflictMode', { type: String, default: 'show' })

const { search_history, addSearchHistory } = useSearchHistory()

const keyword_focused = ref(false)

const show_history = computed(() => keyword_focused.value && !props.disabled && search_history.value.length > 0)

function selectHistory(value) {
	keyword.value = value
	keyword_focused.value = false
}

function deptGroup(dept) {
	if (dept.includes('進修部')) return '進修部'
	if (dept.includes('學院')) return '學院'
	if (dept.includes('碩') || dept.includes('博') || dept.includes('在職專班')) return '碩士/碩專/博士/在職專班'
	if (isDayBachelorDept(dept)) return '四技日間部'
	return '全校'
}

const course_index = computed(() => {
	const group_map = new Map(DEPT_GROUPS.map(name => [name, []]))
	const enroll_types = new Set(['必修', '選修', '重修'])
	const dept_map = new Map()
	for (const course of props.courseList) {
		if (isAltCourse(course)) continue
		const { dept, grade, class_group, enroll_type, general_type } = course
		if (enroll_type) enroll_types.add(enroll_type)
		if (!dept) continue
		let dept_info = dept_map.get(dept)
		if (!dept_info) {
			dept_info = { classes: new Map(), general_types: new Set(), grades: new Map() }
			dept_map.set(dept, dept_info)
			group_map.get(deptGroup(dept)).push(dept)
		}
		if (general_type) dept_info.general_types.add(general_type)
		if (grade == null || grade === '') continue
		collectGradeInfo(dept_info.grades, String(grade), course)
		if (!class_group) continue
		const id = `${grade}-${class_group}`
		if (!dept_info.classes.has(id)) dept_info.classes.set(id, { id, grade, class_group, label: `${grade} ${class_group}` })
	}
	return {
		dept_groups: DEPT_GROUPS
			.map(name => ({ name, depts: group_map.get(name) }))
			.filter(group => group.depts.length),
		enroll_types: Array.from(enroll_types),
		dept_map
	}
})

const dept_groups = computed(() => course_index.value.dept_groups)

const current_dept_info = computed(() => course_index.value.dept_map.get(dept.value) || null)

const class_group_note = computed(() => {
	const note_map = CLASS_GROUP_NOTES[dept.value]
	if (!note_map) return {}
	const term = term_id.value.replace('-', '').substring(3, 4)
	const notes = {}
	for (const key in note_map) {
		const note = note_map[key]
		notes[key] = Array.isArray(note) ? note[term] : note
	}
	return notes
})

const class_options = computed(() => {
	if (dept.value === 'any' || !current_dept_info.value) return []
	const note_map = class_group_note.value
	return Array.from(current_dept_info.value.classes.values(), cls => ({
		...cls,
		note: note_map[`${cls.grade}${cls.class_group}`]
	}))
})

function classIds(next_dept) {
	const dept_info = course_index.value.dept_map.get(next_dept)
	return dept_info ? Array.from(dept_info.classes.keys()) : []
}

function generalTypes(next_dept) {
	const dept_info = next_dept.includes('通識中心') ? course_index.value.dept_map.get(next_dept) : null
	return dept_info ? Array.from(dept_info.general_types) : []
}

const enroll_type_options = computed(() => course_index.value.enroll_types)

const show_mixed = computed(() => {
	if (grade_class.value === 'any' || !current_dept_info.value) return false
	const [grade, class_group] = grade_class.value.split('-')
	return canShowMixedGrade(dept.value, class_group, current_dept_info.value.grades.get(grade))
})

const general_type_options = computed(() => generalTypes(dept.value))

const grade_class_disabled = computed(() => props.disabled || dept.value === 'any' || (enroll_type.value !== 'any' && enroll_type.value.includes('_')))

watch(dept, () => {
	if (grade_class.value !== 'any' && !class_options.value.some(cls => cls.id === grade_class.value)) {
		grade_class.value = 'any'
	}
	if (enroll_type.value !== 'any' && !enroll_type_options.value.includes(enroll_type.value)) {
		enroll_type.value = 'any'
	}
})

watch(enroll_type, () => {
	if (grade_class.value !== 'any' && !class_options.value.some(cls => cls.id === grade_class.value)) {
		grade_class.value = 'any'
	}
})

watch(show_mixed, show => {
	if (!show && enroll_type.value === 'mixed') enroll_type.value = 'any'
})

watch(() => props.courseList, list => {
	if (!list.length) return
	const next_dept = dept.value !== 'any' && !dept_groups.value.some(group => group.depts.includes(dept.value)) ? 'any' : dept.value
	if (next_dept !== dept.value) dept.value = next_dept
	if (enroll_type.value !== 'any' && enroll_type.value !== 'mixed' && !enroll_type_options.value.includes(enroll_type.value) && !generalTypes(next_dept).includes(enroll_type.value)) {
		enroll_type.value = 'any'
	}
	if (grade_class.value !== 'any' && !classIds(next_dept).includes(grade_class.value)) {
		grade_class.value = 'any'
	}
}, { immediate: true })
</script>

<template>
	<div class="flex flex-col gap-4">
		<FilterField label="學年 / 學期">
			<TermSelect v-model="term_id" :term-list="termList" :disabled="disabled" trigger-class="w-full bg-color-1" />
		</FilterField>

		<FilterField label="課程名稱 / 老師 / 序號">
			<div class="relative">
				<Input
					v-model="keyword"
					:disabled="disabled"
					placeholder="輸入關鍵字"
					aria-label="課程名稱 / 老師 / 序號"
					class="bg-color-1 placeholder:text-sm pr-8"
					@focus="keyword_focused = true"
					@click="keyword_focused = true"
					@keyup.enter="addSearchHistory(keyword)"
					@blur="keyword_focused = false; addSearchHistory(keyword)"
				/>
				<button
					v-if="keyword && !disabled"
					type="button"
					class="text-color-6 hover:text-color-9 absolute top-1/2 right-3 -translate-y-1/2"
					aria-label="清除關鍵字"
					@click="keyword = ''"
				>
					<X class="size-4" />
				</button>
			</div>

			<div v-if="show_history" class="border-color-3 bg-color-1 overflow-hidden rounded-md border" @mousedown.prevent>
				<SearchHistory compact @select="selectHistory($event)" />
			</div>
		</FilterField>

		<FilterField label="開課單位 / 系所" :disabled="disabled">
			<Select v-model="dept" :disabled="disabled">
				<SelectTrigger class="w-full bg-color-1" aria-label="開課單位 / 系所">
					<SelectValue />
				</SelectTrigger>
				<SelectContent>
					<SelectItem :value="'any'">不限</SelectItem>
					<SelectGroup v-for="group in dept_groups" :key="group.name">
						<SelectLabel>{{ group.name }}</SelectLabel>
						<SelectItem v-for="name in group.depts" :key="name" :value="name">{{ name }}</SelectItem>
					</SelectGroup>
				</SelectContent>
			</Select>
		</FilterField>

		<SelectFilterField
			v-model="grade_class"
			label="開課班級"
			any-label="不限"
			:options="class_options.map(cls => ({ value: cls.id, label: cls.label, note: cls.note }))"
			:disabled="grade_class_disabled"
		/>

		<FilterField :label="general_type_options.length ? '修別 / 通識類型' : '修別'" :disabled="disabled">
			<Select v-model="enroll_type" :disabled="disabled">
				<SelectTrigger class="w-full bg-color-1" :aria-label="general_type_options.length ? '修別 / 通識類型' : '修別'">
					<SelectValue />
				</SelectTrigger>
				<SelectContent>
					<SelectItem :value="'any'">不限</SelectItem>
					<SelectItem v-if="show_mixed" :value="'mixed'">{{ formatMixed(grade_class) }}</SelectItem>
					<SelectItem v-for="type in enroll_type_options" :key="type" :value="type">{{ type }}</SelectItem>
					<SelectGroup v-if="general_type_options.length">
						<SelectLabel>通識類型</SelectLabel>
						<SelectItem v-for="type in general_type_options" :key="type" :value="type">{{ type }}</SelectItem>
					</SelectGroup>
				</SelectContent>
			</Select>
		</FilterField>

		<FilterField label="衝堂的課程" :disabled="disabled">
			<template #label-extra>
				<Popover>
					<PopoverTrigger as-child>
						<button type="button" class="text-color-6 hover:text-color-9 flex cursor-pointer items-center" aria-label="衝堂的課程說明">
							<Info class="size-3.5" />
						</button>
					</PopoverTrigger>
					<PopoverContent side="top" class="p-3 text-sm">
						與<span class="font-semibold">收藏的課程</span>時間重疊的課程，如不隱藏會以 <TriangleAlert class="inline-block size-3 align-middle text-red-500" /> 標示，置底僅列表檢視有用
					</PopoverContent>
				</Popover>
			</template>
			<Tabs v-model="conflict_mode" class="w-full">
				<TabsList class="bg-color-1 border-color-3 w-full border" aria-label="衝堂的課程">
					<TabsTrigger
						v-for="opt in CONFLICT_MODE_OPTIONS"
						:key="opt.value"
						:value="opt.value"
						:disabled="disabled"
					>{{ opt.label }}</TabsTrigger>
				</TabsList>
			</Tabs>
		</FilterField>
	</div>
</template>
