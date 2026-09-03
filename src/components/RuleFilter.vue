<script setup>
import { computed, watch } from 'vue'
import { findRule, findSelfRule, ruleGroups, deptGroups, findDept, DEFAULT_ID } from '@/lib/rule'
import { spaceText } from '@/lib/utils'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectGroup, SelectLabel, SelectItem } from '@/components/ui/select'
import { Combobox, ComboboxTrigger, ComboboxContent, ComboboxGroup, ComboboxLabel, ComboboxItem } from '@/components/ui/combobox'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import TermSelect from '@/components/TermSelect.vue'
import FilterField from '@/components/FilterField.vue'
import SelectFilterField from '@/components/SelectFilterField.vue'

const SORT_MODE_OPTIONS = [
	{ value: 'term', label: '上 → 下學期，再依年級' },
	{ value: 'grade', label: '依年級，再依學期' }
]

const props = defineProps({
	ruleMap: {
		type: Object,
		default: () => ({})
	},
	deptMap: {
		type: Object,
		default: () => ({})
	},
	enrollTermList: {
		type: Array,
		default: () => []
	},
	disabled: {
		type: Boolean,
		default: false
	}
})

const year = defineModel('year', { type: String, default: '' })
const dept = defineModel('dept', { type: String, default: DEFAULT_ID })
const rule_id = defineModel('ruleId', { type: String, default: '' })
const enroll_term_id = defineModel('enrollTermId', { type: String, default: '' })
const sort_mode = defineModel('sortMode', { type: String, default: 'grade' })

const year_options = computed(() => Object.keys(props.ruleMap).sort((a, b) => Number(b) - Number(a)))

const dept_groups = computed(() => deptGroups(props.deptMap, year.value))

const dept_name = computed(() => findDept(props.deptMap, year.value, dept.value)?.name || '')

const self_rule = computed(() => findSelfRule(props.ruleMap, props.deptMap, year.value, dept.value))

const rule_groups = computed(() => ruleGroups(props.ruleMap, props.deptMap, year.value, dept.value))

const rule_name = computed(() => {
	if (!rule_id.value) return ''
	if (rule_id.value === DEFAULT_ID) return self_rule.value ? '入學課程總表' : ''
	return spaceText(findRule(props.ruleMap, props.deptMap, year.value, dept.value, rule_id.value)?.name || '')
})

function ruleDescription(rule) {
	return [rule.dept, rule.disabled ? '(本系不可修)' : ''].filter(Boolean).join(' ')
}

function syncDeptRule(next_year) {
	const dept_ids = deptGroups(props.deptMap, next_year).flatMap(item => item.depts.map(option => option.id))
	const next_dept = dept.value !== DEFAULT_ID && !dept_ids.includes(dept.value) ? DEFAULT_ID : dept.value
	if (next_dept !== dept.value) dept.value = next_dept
	const self = findSelfRule(props.ruleMap, props.deptMap, next_year, next_dept)
	const rule_ids = [
		...(self ? [DEFAULT_ID] : []),
		...ruleGroups(props.ruleMap, props.deptMap, next_year, next_dept).flatMap(group => group.rules.filter(rule => !rule.disabled).map(rule => rule.id))
	]
	if (rule_ids.includes(rule_id.value)) return
	rule_id.value = self ? DEFAULT_ID : ''
}

watch(() => props.ruleMap, () => {
	if (!year_options.value.length) return
	const next_year = year_options.value.includes(year.value) ? year.value : year_options.value[0]
	if (next_year !== year.value) year.value = next_year
	syncDeptRule(next_year)
}, { immediate: true })

watch(year, () => {
	syncDeptRule(year.value)
})

watch(dept, () => {
	rule_id.value = self_rule.value ? DEFAULT_ID : ''
})

watch(() => props.enrollTermList, () => {
	if (!props.enrollTermList.length) return
	if (props.enrollTermList.includes(enroll_term_id.value)) return
	enroll_term_id.value = props.enrollTermList[0]
}, { immediate: true })
</script>

<template>
	<div class="flex flex-col gap-4">
		<SelectFilterField
			v-model="year"
			label="入學學年度"
			placeholder="選擇學年度"
			:options="year_options.map(option => ({ value: option, label: `${option} 學年`, description: `U${String(option).slice(-2)}` }))"
			inline-description
			:disabled="disabled"
		/>

		<FilterField label="入學系所 / 學程 / 組別" :disabled="disabled">
			<Select v-model="dept" :disabled="disabled">
				<SelectTrigger class="w-full bg-color-1" aria-label="入學系所 / 學程 / 組別">
					<SelectValue>{{ dept_name || '不限' }}</SelectValue>
				</SelectTrigger>
				<SelectContent>
					<SelectItem :value="DEFAULT_ID">不限</SelectItem>
					<SelectGroup v-for="item in dept_groups" :key="item.group_name">
						<SelectLabel>{{ item.group_name }}</SelectLabel>
						<SelectItem v-for="option in item.depts" :key="option.id" :value="option.id">{{ option.name }}</SelectItem>
					</SelectGroup>
				</SelectContent>
			</Select>
		</FilterField>

		<FilterField label="課程總表" :disabled="disabled">
			<Combobox v-model="rule_id" :disabled="disabled">
				<ComboboxTrigger class="w-full bg-color-1" aria-label="課程總表">
					<span v-if="rule_name">{{ rule_name }}</span>
					<span v-else class="text-color-6">選擇總表</span>
				</ComboboxTrigger>
				<ComboboxContent search-placeholder="搜尋學分學程" empty-text="找不到符合的總表">
					<ComboboxItem v-if="self_rule" :value="DEFAULT_ID">入學課程總表</ComboboxItem>
					<ComboboxGroup v-for="group in rule_groups" :key="group.group_name">
						<ComboboxLabel>{{ group.group_name }}</ComboboxLabel>
						<ComboboxItem
							v-for="rule in group.rules"
							:key="rule.id"
							:value="rule.id"
							:disabled="rule.disabled"
							:text-value="rule.name"
							:description="ruleDescription(rule)"
						>{{ spaceText(rule.name) }}</ComboboxItem>
					</ComboboxGroup>
				</ComboboxContent>
			</Combobox>
		</FilterField>

		<FilterField label="欲選課學期" :disabled="disabled">
			<TermSelect
				v-model="enroll_term_id"
				:term-list="enrollTermList"
				:disabled="disabled"
				trigger-class="w-full bg-color-1"
			/>
		</FilterField>

		<FilterField label="課程排序" :disabled="disabled">
			<RadioGroup v-model="sort_mode" :disabled="disabled" aria-label="課程排序">
				<RadioGroupItem
					v-for="opt in SORT_MODE_OPTIONS"
					:key="opt.value"
					:value="opt.value"
					:disabled="disabled"
				>{{ opt.label }}</RadioGroupItem>
			</RadioGroup>
		</FilterField>
	</div>
</template>
