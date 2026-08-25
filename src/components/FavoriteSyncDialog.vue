<script setup>
import { ref, computed, watch } from 'vue'
import { Cloud, Check } from '@lucide/vue'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { toast } from '@/components/ui/sonner'
import InlineLoading from '@/components/InlineLoading.vue'
import EmptyHint from '@/components/EmptyHint.vue'
import { useDevice } from '@/composables/useDevice'
import { useFavoriteSync } from '@/lib/favorite'
import { getCourseMap, courseDisplayName, formatCourseMeta } from '@/lib/course'
import { termIdFromCourseId, formatTermShort } from '@/lib/term'
import { parseTime, formatDateTime } from '@/lib/utils'

// 課程資料讀取提示的最短顯示時間, 避免讀取很快時清單閃一下才出現
const MIN_LOADING_MS = 400

const { remote_ids, remote_last_updated, conflict_open, favorite_ids, resolveConflict } = useFavoriteSync()
const { device_icon } = useDevice()

const selected_ids = ref(new Set())
const course_map = ref(new Map())
const courses_loading = ref(false)
const load_error = ref(false)

const missing_ids = computed(() => {
	const ids = new Set()
	if (courses_loading.value || load_error.value) return ids
	for (const id of [...favorite_ids.value, ...remote_ids.value]) {
		if (!course_map.value.has(id)) ids.add(id)
	}
	return ids
})

const local_only_ids = computed(() => [...favorite_ids.value].filter(id => !remote_ids.value.has(id) && !missing_ids.value.has(id)).sort())
const remote_only_ids = computed(() => [...remote_ids.value].filter(id => !favorite_ids.value.has(id) && !missing_ids.value.has(id)).sort())
const both_ids = computed(() => [...favorite_ids.value].filter(id => remote_ids.value.has(id) && !missing_ids.value.has(id)).sort())

const remote_time_text = computed(() => {
	const time = parseTime(remote_last_updated.value)
	if (!time) return ''
	return formatDateTime(time, 'YYYY/MM/DD HH:mm')
})

const group_list = computed(() => [
	{ key: 'local', title: '只在這台裝置', icon: device_icon.value, note: '', ids: local_only_ids.value },
	{ key: 'remote', title: '只在帳號中有', icon: Cloud, note: remote_time_text.value ? `更新於 ${remote_time_text.value}` : '', ids: remote_only_ids.value },
	{ key: 'both', title: '兩邊都有', icon: Check, note: '', ids: both_ids.value }
].filter(group => group.ids.length))

const selected_count = computed(() => selected_ids.value.size)

function courseOf(id) {
	return course_map.value.get(id) || { id }
}

function isSelected(id) {
	return selected_ids.value.has(id)
}

function toggleId(id, checked) {
	const next = new Set(selected_ids.value)
	if (checked) next.add(id)
	else next.delete(id)
	selected_ids.value = next
}

function groupState(ids) {
	const count = ids.filter(isSelected).length
	if (!count) return false
	return count === ids.length ? true : 'indeterminate'
}

function toggleGroup(ids, checked) {
	const next = new Set(selected_ids.value)
	for (const id of ids) {
		if (checked) next.add(id)
		else next.delete(id)
	}
	selected_ids.value = next
}

async function loadCourses(ids) {
	course_map.value = new Map()
	courses_loading.value = true
	load_error.value = false
	const started_at = Date.now()
	try {
		course_map.value = await getCourseMap(ids)
		selected_ids.value = new Set(ids.filter(id => course_map.value.has(id)))
	} catch (error) {
		console.error(error)
		load_error.value = true
	} finally {
		const rest_ms = MIN_LOADING_MS - (Date.now() - started_at)
		if (rest_ms > 0) await new Promise(resolve => setTimeout(resolve, rest_ms))
		courses_loading.value = false
	}
}

function onConfirm() {
	const count = selected_count.value
	resolveConflict(selected_ids.value)
	toast.success(count ? `已保留 ${count} 門收藏課程` : '已清空收藏課程')
}

watch(conflict_open, open => {
	if (!open) return
	const ids = [...new Set([...favorite_ids.value, ...remote_ids.value])]
	selected_ids.value = new Set(ids)
	loadCourses(ids)
}, { immediate: true })
</script>

<template>
	<Dialog v-model:open="conflict_open">
		<DialogContent
			class="max-w-md"
			:show-close-button="false"
			@escape-key-down="event => event.preventDefault()"
			@interact-outside="event => event.preventDefault()"
		>
			<DialogHeader>
				<DialogTitle>收藏的課程不一致</DialogTitle>
				<DialogDescription>這台裝置登入前已有收藏，與帳號中儲存的不同，請勾選要保留的課程。</DialogDescription>
			</DialogHeader>

			<InlineLoading v-if="courses_loading" text="課程資料讀取中…" size="size-6" container-class="flex-col py-12" />

			<EmptyHint v-else-if="!group_list.length">收藏的課程都已不存在</EmptyHint>

			<div v-else class="-mx-2 flex max-h-[50dvh] flex-col gap-3 overflow-y-auto overscroll-contain px-2">
				<div v-for="group in group_list" :key="group.key" class="flex flex-col gap-1">
					<Checkbox
						:model-value="groupState(group.ids)"
						class="items-start bg-color-2 px-3 py-2"
						@update:model-value="value => toggleGroup(group.ids, value === true)"
					>
						<span class="flex items-center gap-2">
							<component :is="group.icon" class="size-4 shrink-0 text-color-6" />
							<span class="flex-1 font-medium">{{ group.title }}</span>
							<span class="text-xs text-color-6">{{ group.ids.length }} 門</span>
						</span>
						<span v-if="group.note" class="mt-0.5 block pl-6 text-xs text-color-6">{{ group.note }}</span>
					</Checkbox>

					<Checkbox
						v-for="id in group.ids"
						:key="id"
						:model-value="isSelected(id)"
						class="items-start px-3 py-1"
						@update:model-value="value => toggleId(id, value === true)"
					>
						<span class="block">{{ formatTermShort(termIdFromCourseId(id)) }} {{ courseDisplayName(courseOf(id)) }}</span>
						<span v-if="courseOf(id).name" class="block text-xs break-words text-color-6">{{ formatCourseMeta(courseOf(id)) }}</span>
					</Checkbox>
				</div>
			</div>

			<DialogFooter>
				<Button class="w-full" :disabled="courses_loading" @click="onConfirm()">
					{{ selected_count > 0 ? `保留勾選的 ${selected_count} 門課程` : '不保留任何課程' }}
				</Button>
			</DialogFooter>
		</DialogContent>
	</Dialog>
</template>
