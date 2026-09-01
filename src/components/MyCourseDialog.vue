<script setup>
import { ref, computed, watch } from 'vue'
import { SECTION_ORDER, SECTION_TIME, WEEKDAY_LABELS } from '@/lib/course-format'
import { MY_WEEKDAYS, NAME_MAX_LENGTH, REMARK_MAX_LENGTH, findConflict } from '@/lib/my-course'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import FilterField from '@/components/FilterField.vue'

const open = defineModel('open', { type: Boolean, default: false })

const props = defineProps({
	course: {
		type: Object,
		default: null
	},
	defaults: {
		type: Object,
		default: null
	},
	courses: {
		type: Array,
		default: () => []
	}
})

const emit = defineEmits(['submit', 'remove'])

const name = ref('')
const day = ref(String(MY_WEEKDAYS[0]))
const start = ref('1')
const end = ref('1')
const remark = ref('')
const name_error = ref('')
const time_error = ref('')

const is_edit = computed(() => Boolean(props.course))

const day_options = computed(() => MY_WEEKDAYS.map(value => ({ value: String(value), label: `星期${WEEKDAY_LABELS[value]}` })))

const section_options = computed(() => SECTION_ORDER.map(section => ({
	value: String(section),
	label: `${section}`,
	description: SECTION_TIME[section] ? `${SECTION_TIME[section][0]} ~ ${SECTION_TIME[section][1]}` : ''
})))

const end_options = computed(() => section_options.value.filter(option => Number(option.value) >= Number(start.value)))

watch(open, value => {
	if (!value) return
	const source = props.course || props.defaults || {}
	name.value = source.name || ''
	day.value = String(source.day ?? MY_WEEKDAYS[0])
	start.value = String(source.start ?? 1)
	end.value = String(source.end ?? source.start ?? 1)
	remark.value = source.remark || ''
	name_error.value = ''
	time_error.value = ''
})

watch(start, value => {
	if (Number(end.value) < Number(value)) end.value = value
})

watch(name, () => {
	name_error.value = ''
})

watch([day, start, end], () => {
	time_error.value = ''
})

function submit() {
	const course_name = name.value.trim()
	if (!course_name) {
		name_error.value = '請輸入課程名稱'
		return
	}
	const data = {
		name: course_name.slice(0, NAME_MAX_LENGTH),
		day: Number(day.value),
		start: Number(start.value),
		end: Number(end.value),
		remark: remark.value.trim().slice(0, REMARK_MAX_LENGTH)
	}
	const conflict = findConflict(props.courses, data, props.course?.id)
	if (conflict) {
		time_error.value = `與「${conflict.name}」的時段重疊`
		return
	}
	open.value = false
	emit('submit', data)
}

function remove() {
	open.value = false
	emit('remove')
}
</script>

<template>
	<Dialog v-model:open="open">
		<DialogContent class="max-w-sm">
			<DialogHeader>
				<DialogTitle>{{ is_edit ? '編輯課程' : '新增課程' }}</DialogTitle>
			</DialogHeader>

			<form class="flex flex-col gap-4" @submit.prevent="submit">
				<FilterField label="課程名稱">
					<Input v-model="name" :maxlength="NAME_MAX_LENGTH" class="bg-color-1" aria-label="課程名稱" />
					<p v-if="name_error" class="text-xs text-destructive">{{ name_error }}</p>
				</FilterField>

				<FilterField label="星期">
					<Select v-model="day">
						<SelectTrigger class="w-full bg-color-1" aria-label="星期">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem v-for="option in day_options" :key="option.value" :value="option.value">{{ option.label }}</SelectItem>
						</SelectContent>
					</Select>
				</FilterField>

				<div class="grid grid-cols-2 gap-3">
					<FilterField label="開始節次">
						<Select v-model="start">
							<SelectTrigger class="w-full bg-color-1" aria-label="開始節次">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem v-for="option in section_options" :key="option.value" :value="option.value" :description="option.description" inline-description>{{ option.label }}</SelectItem>
							</SelectContent>
						</Select>
					</FilterField>

					<FilterField label="結束節次">
						<Select v-model="end">
							<SelectTrigger class="w-full bg-color-1" aria-label="結束節次">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem v-for="option in end_options" :key="option.value" :value="option.value" :description="option.description" inline-description>{{ option.label }}</SelectItem>
							</SelectContent>
						</Select>
					</FilterField>
				</div>

				<p v-if="time_error" class="-mt-2 text-xs text-destructive">{{ time_error }}</p>

				<FilterField label="備註">
					<Input v-model="remark" :maxlength="REMARK_MAX_LENGTH" class="bg-color-1" placeholder="可填寫教室/老師 (可留空)" aria-label="備註" />
				</FilterField>

				<DialogFooter>
					<Button v-if="is_edit" type="button" variant="destructive-ghost" class="flex-1" @click="remove()">刪除</Button>
					<Button type="submit" class="flex-1">儲存</Button>
				</DialogFooter>
			</form>
		</DialogContent>
	</Dialog>
</template>
