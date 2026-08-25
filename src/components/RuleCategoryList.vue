<script setup>
import { computed } from 'vue'
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion'
import { Badge } from '@/components/ui/badge'
import { CROSS_DEPT_BADGE_CLASS, DEFAULT_ID } from '@/lib/rule'
import { spaceText } from '@/lib/utils'

const props = defineProps({
	categories: {
		type: Array,
		default: () => []
	},
	courseMap: {
		type: Map,
		default: () => new Map()
	},
	crossProgram: {
		type: Boolean,
		default: false
	},
	deptId: {
		type: String,
		default: DEFAULT_ID
	}
})

const emit = defineEmits(['count-click'])

const open_subs = defineModel('open', { type: Array, default: () => [] })

function courseRemark(course) {
	const text = (course.remark || '').trim()
	return text === '-' ? '' : text
}

function openCourses(course) {
	const codes = [course.id, ...(course.codes || [])]
	return codes.flatMap(code => props.courseMap.get(code) || [])
}

function courseDeptLabel(course) {
	if (!props.crossProgram) return ''
	if (course.id.startsWith('AA')) return '外校'
	if (!props.deptId || props.deptId === DEFAULT_ID) return ''
	if (!course.depts?.length || course.depts.includes(props.deptId)) return ''
	return '外系'
}

const category_rows = computed(() => props.categories.map(category =>
	(category.category_list || []).map(sub => (sub.course_list || []).map(course => ({
		course,
		open_courses: openCourses(course),
		dept_label: courseDeptLabel(course),
		remark: courseRemark(course)
	})))
))
</script>

<template>
	<div
		v-for="(category, category_index) in categories"
		:key="category.name"
	>
		<div class="flex items-center gap-2 px-4 py-2 lg:px-0">
			<h2 class="text-xs text-color-6">{{ category.display_name }}</h2>
			<Badge v-if="category.label" variant="outline" class="bg-color-3">{{ spaceText(category.label) }}</Badge>
		</div>
		<div class="overflow-hidden rounded-none border bg-color-1 lg:rounded-lg">
			<div v-if="category.req || category.remark" class="px-4 py-2 text-sm">
				<p v-if="category.req" class="mt-1 text-xs text-color-7">{{ category.req }}</p>
				<p v-if="category.remark" class="mt-1 text-xs whitespace-pre-line text-color-7">{{ category.remark }}</p>
			</div>
			<Accordion v-model="open_subs[category_index]" type="multiple" class="flex flex-col">
				<AccordionItem
					v-for="(sub, sub_index) in category.category_list"
					:key="sub.name"
					:value="String(sub_index)"
					class="border-t border-b-0 last:border-b-0"
				>
					<AccordionTrigger class="rounded-none bg-color-3 px-4 py-2 text-base hover:no-underline">
						<span class="flex flex-wrap items-center gap-2 font-medium">
							{{ sub.display_name }}
							<Badge v-if="sub.label" variant="outline" class="bg-color-1">{{ spaceText(sub.label) }}</Badge>
						</span>
					</AccordionTrigger>
					<AccordionContent class="pb-0">
						<table class="block w-full text-sm md:table md:table-fixed">
							<colgroup>
								<col class="w-[40%]" />
								<col class="w-16" />
								<col class="w-16" />
								<col class="w-24" />
								<col />
							</colgroup>
							<tbody class="block md:table-row-group">
								<tr
									v-for="row in category_rows[category_index][sub_index]"
									:key="row.course.id"
									class="grid grid-cols-[minmax(0,1fr)_2.5rem_4rem] gap-x-2 border-b px-4 py-2 align-top last:border-0 md:table-row md:px-0 md:py-0"
								>
									<td class="min-w-0 font-medium break-words md:px-4 md:py-2">
										{{ row.course.name }}
										<Badge v-if="row.dept_label" size="sm" :class="['ml-1', CROSS_DEPT_BADGE_CLASS]">{{ row.dept_label }}</Badge>
									</td>
									<td class="text-right whitespace-nowrap md:table-cell md:px-2 md:py-2 md:text-left">{{ row.course.term }}</td>
									<td class="text-right whitespace-nowrap md:table-cell md:px-2 md:py-2 md:text-left">{{ row.course.credit }} 學分</td>
									<td
										class="col-span-3 mt-1 text-xs whitespace-nowrap md:col-span-1 md:mt-0 md:table-cell md:px-2 md:py-2 md:text-sm"
										:class="courseMap.size ? '' : 'hidden md:table-cell'"
									>
										<button
											v-if="row.open_courses.length"
											type="button"
											class="text-color-10 underline decoration-dotted underline-offset-2 hover:text-color-9"
											@click="emit('count-click', { course: row.course, courses: row.open_courses })"
										>{{ row.open_courses.length }} 門開課</button>
										<span v-else-if="courseMap.size" class="text-color-5">未開課</span>
									</td>
									<td
										class="col-span-3 mt-1 text-xs break-words text-color-7 md:col-span-1 md:mt-0 md:table-cell md:px-4 md:py-2 md:text-sm md:text-inherit"
										:class="row.remark ? '' : 'hidden md:table-cell'"
									>
										{{ row.remark }}
									</td>
								</tr>
							</tbody>
						</table>
					</AccordionContent>
				</AccordionItem>
			</Accordion>
		</div>
	</div>
</template>
