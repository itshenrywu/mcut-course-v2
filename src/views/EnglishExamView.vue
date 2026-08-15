<script setup>
import { computed, onMounted, watch } from 'vue'
import { useExamList, examGrades, examColleges, examLevels } from '@/lib/exam'
import { useEmptyState } from '@/lib/loader'
import { useLocalRef } from '@/lib/storage'
import { spaceText, cellClass, cellText, useValidOption } from '@/lib/utils'
import LoadingOverlay from '@/components/LoadingOverlay.vue'
import LoadError from '@/components/LoadError.vue'
import SelectFilterField from '@/components/SelectFilterField.vue'
import SectionCard from '@/components/SectionCard.vue'
import SponsorAd from '@/components/SponsorAd.vue'
import PageContainer from '@/components/PageContainer.vue'
import InfoTable from '@/components/InfoTable.vue'
import EmptyHint from '@/components/EmptyHint.vue'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

const EXAM_TABLE_HEADERS = [
	{ label: '班級', class: 'w-[40%]' },
	{ label: '授課老師', class: 'w-[25%]' },
	{ label: '地點', class: 'w-[35%]' }
]

const selected_course = useLocalRef('mcv2-exam-course')
const selected_college = useLocalRef('mcv2-exam-college', 'any')
const selected_level = useLocalRef('mcv2-exam-level', 'any')

const { exam_list, loading, loaded, load_error, loadExamList, markExamSeen } = useExamList()

onMounted(() => {
	if (!exam_list.value.length) loadExamList()
})

const grade_options = computed(() => examGrades(exam_list.value))

const course_list = computed(() => exam_list.value.filter(item => item.course === selected_course.value))

const college_options = computed(() => examColleges(course_list.value))

const level_options = computed(() => examLevels(course_list.value))

const filtered_list = computed(() => course_list.value.filter(item =>
	(selected_college.value === 'any' || item.college === selected_college.value) &&
	(selected_level.value === 'any' || item.level === selected_level.value)))

const exam_time_list = computed(() => [...new Set(course_list.value.map(item => [item.date, item.time].filter(Boolean).join(' ')))].filter(Boolean))

const show_empty_hint = useEmptyState(filtered_list, { loading, loaded, load_error })

watch(exam_list, () => {
	if (!exam_list.value.length) return
	if (!grade_options.value.some(option => option.course === selected_course.value)) {
		selected_course.value = grade_options.value[0]?.course || ''
	}
	markExamSeen()
}, { immediate: true })

useValidOption(selected_college, college_options, { enabled: () => exam_list.value.length > 0 })
useValidOption(selected_level, level_options, { enabled: () => exam_list.value.length > 0 })
</script>

<template>
	<LoadingOverlay v-if="loading" text="英文段考時間與考場讀取中…" />
	<LoadError v-else-if="load_error" title="英文段考時間與考場讀取失敗" @retry="loadExamList({ force: true })" />

	<PageContainer title="英文段考時間與考場" container-class="gap-6">
		<div class="flex flex-col gap-4">
			<Tabs v-if="grade_options.length" v-model="selected_course">
				<TabsList class="bg-color-1 border-color-3 h-auto w-full border" aria-label="年級">
					<TabsTrigger
						v-for="option in grade_options"
						:key="option.course"
						:value="option.course"
						class="flex-col gap-0 py-1.5"
					>
						{{ option.label }}
						<span class="text-xs font-normal opacity-70">{{ option.course }}</span>
					</TabsTrigger>
				</TabsList>
			</Tabs>

			<div class="grid gap-4 grid-cols-2">
				<SelectFilterField
					v-model="selected_college"
					label="學院 / 系所"
					any-label="不限"
					:options="college_options.map(college => ({ value: college, label: spaceText(college) }))"
					:disabled="loading"
				/>

				<SelectFilterField
					v-model="selected_level"
					label="班級"
					any-label="不限"
					:options="level_options"
					:disabled="loading"
				/>
			</div>
		</div>

		<SectionCard v-if="filtered_list.length" :title="exam_time_list.length ? `考試時間　${exam_time_list.join('、')}` : ''" card-class="overflow-hidden">
			<InfoTable :headers="EXAM_TABLE_HEADERS" fixed>
				<tr v-for="item in filtered_list" :key="item.class_name">
					<td class="px-3 py-2.5 font-medium">{{ spaceText(item.class_name) }}</td>
					<td class="text-color-8 px-3 py-2.5">{{ cellText(item.teacher) }}</td>
					<td class="px-3 py-2.5" :class="cellClass(item.place)">{{ cellText(item.place) }}</td>
				</tr>
			</InfoTable>
		</SectionCard>

		<EmptyHint v-else-if="show_empty_hint">目前沒有考場資料，請稍後或改天再試</EmptyHint>

		<SponsorAd v-if="filtered_list.length" />
	</PageContainer>
</template>
