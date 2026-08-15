<script setup>
import { ref, computed, watch, onUnmounted } from 'vue'
import { Cloud } from '@lucide/vue'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from '@/components/ui/sonner'
import MyCourseTable from '@/components/MyCourseTable.vue'
import InlineLoading from '@/components/InlineLoading.vue'
import { useDevice } from '@/composables/useDevice'
import { useMyCourse, useMyStyle } from '@/lib/my-course'
import { useMyCourseSync } from '@/lib/my-course-sync'
import { useMyBgImage } from '@/lib/my-course-image'
import { useAuth } from '@/lib/auth'
import { getMyImage } from '@/api/user'
import { imageColor } from '@/lib/my-course-canvas'
import { parseTime, formatDateTime } from '@/lib/utils'

const props = defineProps({
	paused: Boolean
})

const { remote_document, remote_last_updated, remote_image_token, conflict_open, resolveConflict } = useMyCourseSync()
const { my_courses } = useMyCourse()
const { my_style } = useMyStyle()
const { bg_image, loadMyBgImage } = useMyBgImage()
const { auth_token } = useAuth()
const { device_icon } = useDevice()

const tab = ref('local')
const local_courses = ref([])
const local_style = ref(my_style.value)
const remote_background = ref(null)
const background_loading = ref(false)

const dialog_open = computed({
	get: () => conflict_open.value && !props.paused,
	set: value => (conflict_open.value = value)
})

const is_remote = computed(() => tab.value === 'remote')
const preview_courses = computed(() => is_remote.value ? remote_document.value.courses : local_courses.value)
const preview_style = computed(() => is_remote.value ? remote_document.value.style : local_style.value)
const preview_background = computed(() => is_remote.value ? remote_background.value : bg_image.value)

const remote_time_text = computed(() => {
	const time = parseTime(remote_last_updated.value)
	if (!time) return ''
	return formatDateTime(time, 'YYYY/MM/DD HH:mm')
})

function onConfirm() {
	const keep_remote = is_remote.value
	resolveConflict(keep_remote)
	toast.success(keep_remote ? '已改用帳號中的課表' : '已保留這台裝置的課表')
}

async function loadRemoteBackground() {
	if (remote_background.value || !remote_image_token.value) return
	background_loading.value = true
	try {
		const blob = await getMyImage(auth_token.value)
		if (!blob) return
		const image = await createImageBitmap(blob)
		remote_background.value = { image, url: URL.createObjectURL(blob), rgb: imageColor(image) }
	} catch (error) {
		console.error(error)
	} finally {
		background_loading.value = false
	}
}

watch(conflict_open, open => {
	if (!open) return
	tab.value = 'local'
	local_courses.value = my_courses.value
	local_style.value = { ...my_style.value }
	loadMyBgImage()
	loadRemoteBackground()
}, { immediate: true })

onUnmounted(() => {
	if (remote_background.value) URL.revokeObjectURL(remote_background.value.url)
})
</script>

<template>
	<Dialog v-model:open="dialog_open">
		<DialogContent
			class="max-w-md"
			:show-close-button="false"
			@escape-key-down="event => event.preventDefault()"
			@interact-outside="event => event.preventDefault()"
		>
			<DialogHeader>
				<DialogTitle>我的課表不一致</DialogTitle>
				<DialogDescription>這台裝置登入前已有課表，與帳號中儲存的不同，請切換預覽後選擇要保留哪一份。</DialogDescription>
			</DialogHeader>

			<Tabs v-model="tab">
				<TabsList class="bg-color-1 border-color-3 w-full border" aria-label="課表來源">
					<TabsTrigger value="local" aria-label="這台裝置的課表">
						<component :is="device_icon" />
						這台裝置
					</TabsTrigger>
					<TabsTrigger value="remote" aria-label="帳號中的課表">
						<Cloud />
						帳號中
					</TabsTrigger>
				</TabsList>
			</Tabs>

			<div class="text-color-6 flex items-center justify-between text-xs">
				<span>{{ preview_courses.length }} 門課程</span>
				<span v-if="is_remote && remote_time_text">更新於 {{ remote_time_text }}</span>
			</div>

			<div class="pointer-events-none relative h-[52vh] max-h-[26rem]">
				<MyCourseTable
					class="h-full"
					fit
					:courses="preview_courses"
					:settings="preview_style"
					:background="preview_background"
				/>
				<div
					v-if="is_remote && background_loading"
					class="bg-color-2/70 absolute inset-0 flex items-center justify-center rounded-lg backdrop-blur-sm"
				>
					<InlineLoading text="背景圖片下載中…" size="size-7" container-class="text-color-9 flex-col gap-3" />
				</div>
			</div>

			<DialogFooter>
				<Button class="w-full" @click="onConfirm()">
					{{ is_remote ? '保留帳號中的課表' : '保留這台裝置的課表' }}
				</Button>
			</DialogFooter>
		</DialogContent>
	</Dialog>
</template>
