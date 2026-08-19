<script setup>
import { ref, computed, watch, useTemplateRef, defineAsyncComponent } from 'vue'
import { SlidersHorizontal, Plus, Import, ImageDown, Smartphone, Trash2 } from '@lucide/vue'
import { useMyCourse, useMyStyle, nextSection, findConflict, MY_STYLE_FIELDS, MY_BG_COLORS, MY_THEMES, MARGIN_MIN, MARGIN_MAX, RADIUS_MIN, RADIUS_MAX, TRANSPARENCY_MIN, TRANSPARENCY_MAX } from '@/lib/my-course'
import { useMyCourseSync, resyncMyCourse } from '@/lib/my-course-sync'
import { useFavoriteSync } from '@/lib/favorite'
import { useMyBgImage, IMAGE_MAX_MB } from '@/lib/my-course-image'
import { saveImage, blobToDataUrl } from '@/lib/image-save'
import { isIOS } from '@/lib/device'
import { toast } from '@/components/ui/sonner'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import FilterField from '@/components/FilterField.vue'
import FilterSidebar from '@/components/FilterSidebar.vue'
import ConfirmDialog from '@/components/ConfirmDialog.vue'
import MyCourseTable from '@/components/MyCourseTable.vue'
import MyCourseDialog from '@/components/MyCourseDialog.vue'
import MyCourseImportDialog from '@/components/MyCourseImportDialog.vue'
import MyCourseWidgetDialog from '@/components/MyCourseWidgetDialog.vue'
import CheckboxSelect from '@/components/CheckboxSelect.vue'
import ColorSelect from '@/components/ColorSelect.vue'
import ThemeSelect from '@/components/ThemeSelect.vue'
import ImagePreviewDialog from '@/components/ImagePreviewDialog.vue'
import HelpDialog from '@/components/HelpDialog.vue'
import InlineLoading from '@/components/InlineLoading.vue'
import SponsorAd from '@/components/SponsorAd.vue'

const MyCourseSyncDialog = defineAsyncComponent(() => import('@/components/MyCourseSyncDialog.vue'))

const SIDEBAR_TABS = [
	{ value: 'table', label: '課表' },
	{ value: 'course', label: '課程' }
]

const IMPORT_SOURCE_LABELS = {
	favorite: '收藏',
	school: '學校系統'
}

const { my_courses, addMyCourse, addMyCourses, updateMyCourse, removeMyCourse, clearMyCourses } = useMyCourse()
const { my_style } = useMyStyle()
const { bg_image, loadMyBgImage, saveMyBgImage, clearMyBgImage } = useMyBgImage()
const { conflict_open: my_course_conflict_open, image_loading } = useMyCourseSync()
const { conflict_open: favorite_conflict_open } = useFavoriteSync()

loadMyBgImage()
resyncMyCourse()

const table_ref = useTemplateRef('table')

const sidebar_open = ref(false)
const sidebar_tab = ref(SIDEBAR_TABS[0].value)
const dialog_open = ref(false)
const import_dialog_open = ref(false)
const widget_dialog_open = ref(false)
const clear_dialog_open = ref(false)
const preview_dialog_open = ref(false)
const preview_url = ref('')
const editing_course = ref(null)
const dialog_defaults = ref(null)
const show_sync_dialog = ref(false)

watch(my_course_conflict_open, open => {
	if (open) show_sync_dialog.value = true
}, { immediate: true })

const has_course = computed(() => my_courses.value.length > 0)

const show_widget = isIOS()

const use_bg_image = computed({
	get: () => my_style.value.bg_type === 'image',
	set: value => {
		my_style.value.bg_type = value ? 'image' : 'color'
	}
})

const margin = computed({
	get: () => [my_style.value.margin],
	set: ([value]) => {
		my_style.value.margin = value
	}
})

const radius = computed({
	get: () => [my_style.value.radius],
	set: ([value]) => {
		my_style.value.radius = value
	}
})

const transparency = computed({
	get: () => [my_style.value.transparency],
	set: ([value]) => {
		my_style.value.transparency = value
	}
})

function openAdd(defaults = null) {
	editing_course.value = null
	dialog_defaults.value = defaults
	dialog_open.value = true
	sidebar_open.value = false
}

function openEdit(course) {
	editing_course.value = course
	dialog_defaults.value = null
	dialog_open.value = true
}

function addAtSlot({ day, section }) {
	const end = nextSection(section)
	const taken = Boolean(findConflict(my_courses.value, { day, start: section, end }))
	openAdd({ day, start: section, end: taken ? section : end })
}

function openImport() {
	import_dialog_open.value = true
	sidebar_open.value = false
}

function openWidget() {
	widget_dialog_open.value = true
	sidebar_open.value = false
}

function importCourses({ blocks, count, source }) {
	addMyCourses(blocks)
	toast.success(`已從${IMPORT_SOURCE_LABELS[source] || IMPORT_SOURCE_LABELS.favorite}匯入 ${count} 門課程`)
}

function submitCourse(data) {
	if (editing_course.value) {
		updateMyCourse(editing_course.value.id, data)
		toast.success('課程已更新', { description: data.name })
		return
	}
	addMyCourse(data)
	toast.success('課程已新增', { description: data.name })
}

function removeCourse() {
	const course = editing_course.value
	if (!course) return
	removeMyCourse(course.id)
	toast.success('課程已刪除', { description: course.name })
}

function clearAll() {
	clearMyCourses()
	sidebar_open.value = false
	toast.success('已清除全部課程')
}

async function pickBgImage(file) {
	if (file.size > IMAGE_MAX_MB * 1024 * 1024) {
		toast.error(`圖片不能超過 ${IMAGE_MAX_MB} MB`)
		return
	}
	try {
		await saveMyBgImage(file)
		use_bg_image.value = true
	} catch (error) {
		console.error(error)
		toast.error('背景圖片儲存失敗')
	}
}

async function removeBgImage() {
	use_bg_image.value = false
	await clearMyBgImage()
}

async function downloadImage() {
	sidebar_open.value = false
	try {
		const blob = await table_ref.value?.renderImage()
		if (!blob) return
		if (await saveImage(blob, '我的課表.png')) return
		preview_url.value = await blobToDataUrl(blob)
		preview_dialog_open.value = true
	} catch (error) {
		console.error(error)
		toast.error('課表圖片下載失敗')
	}
}
</script>

<template>
	<div class="flex min-h-0 w-full flex-1 flex-col">
		<div class="mx-auto flex min-h-0 w-full max-w-7xl flex-1 lg:px-4">
			<FilterSidebar v-model:open="sidebar_open">
				<div class="flex grow flex-col gap-4">
					<Tabs v-model="sidebar_tab">
						<TabsList class="border-color-3 h-auto w-full rounded-none border-b bg-transparent p-0" aria-label="課表設定分頁">
							<TabsTrigger
								v-for="tab in SIDEBAR_TABS"
								:key="tab.value"
								:value="tab.value"
								class="data-[state=active]:text-color-10 data-[state=active]:border-color-10 h-auto rounded-none border-0 border-b-2 px-1 pb-2 data-[state=active]:bg-transparent data-[state=active]:shadow-none"
							>{{ tab.label }}</TabsTrigger>
						</TabsList>
					</Tabs>

					<div class="grid lg:block">
						<div
							class="col-start-1 row-start-1 flex flex-col gap-4"
							:class="sidebar_tab === 'table' ? '' : 'invisible lg:hidden'"
						>
							<CheckboxSelect v-model="my_style" label="顯示設定" :options="MY_STYLE_FIELDS" />

							<ColorSelect
								v-model="my_style.bg_color"
								v-model:image="use_bg_image"
								v-model:custom="my_style.bg_custom_color"
								label="背景"
								:options="MY_BG_COLORS"
								image-enabled
								:image-url="bg_image ? bg_image.url : ''"
								@pick-image="pickBgImage"
								@remove-image="removeBgImage"
							/>

							<FilterField label="外距">
								<template #label-extra>
									<span class="text-color-6 ml-auto text-xs">{{ my_style.margin }}%</span>
								</template>
								<Slider
									v-model="margin"
									:min="MARGIN_MIN"
									:max="MARGIN_MAX"
									class="h-6 cursor-pointer"
									aria-label="課表外距"
								/>
							</FilterField>
						</div>

						<div
							class="col-start-1 row-start-1 flex flex-col gap-4"
							:class="sidebar_tab === 'course' ? '' : 'invisible lg:hidden'"
						>
							<div class="flex flex-col gap-2">
								<div class="grid grid-cols-2 gap-2">
									<Button @click="openAdd()">
										<Plus />
										新增
									</Button>
									<Button variant="outline" @click="openImport()">
										<Import />
										匯入
									</Button>
								</div>
								<Button variant="destructive-ghost" class="w-full" :disabled="!has_course" @click="clear_dialog_open = true">
									<Trash2 />
									清除全部課程
								</Button>
							</div>

							<ThemeSelect v-model="my_style.theme" label="主題配色" :themes="MY_THEMES" />

							<FilterField label="圓角">
								<template #label-extra>
									<span class="text-color-6 ml-auto text-xs">{{ my_style.radius }}</span>
								</template>
								<Slider
									v-model="radius"
									:min="RADIUS_MIN"
									:max="RADIUS_MAX"
									class="h-6 cursor-pointer"
									aria-label="課程方塊圓角"
								/>
							</FilterField>

							<FilterField label="透明度">
								<template #label-extra>
									<span class="text-color-6 ml-auto text-xs">{{ my_style.transparency }}%</span>
								</template>
								<Slider
									v-model="transparency"
									:min="TRANSPARENCY_MIN"
									:max="TRANSPARENCY_MAX"
									class="h-6 cursor-pointer"
									aria-label="課程方塊透明度"
								/>
							</FilterField>
						</div>
					</div>

					<FilterField label="匯出" class="border-color-3 mt-auto border-t pt-4 lg:border-t-0 lg:pt-2">
						<div class="grid gap-2" :class="show_widget ? 'grid-cols-2' : 'grid-cols-1'">
							<Button variant="outline" :disabled="!has_course" @click="downloadImage">
								<ImageDown />
								圖片
							</Button>

							<Button v-if="show_widget" variant="outline" :disabled="!has_course" @click="openWidget()">
								<Smartphone />
								小工具
							</Button>
						</div>
					</FilterField>
				</div>

				<template #footer>
					<HelpDialog button-class="-ml-2">
						<li>與收藏的課程不同，可依實際選課後的課表來製作自己的課表！</li>
						<li>「匯入」可從收藏的課程帶入，或直接貼上從學校系統複製的課表</li>
						<li>點課表的空白格可直接新增課程，點課程方塊則可以編輯或刪除</li>
						<li>「下載圖片」可把課表存成直式圖片，可設成桌布或聊天背景</li>
						<li v-if="show_widget">「安裝 iOS 小工具」可在桌面或鎖定畫面顯示下一堂課</li>
					</HelpDialog>
				</template>
			</FilterSidebar>

			<div class="flex min-h-0 w-full min-w-0 flex-1 flex-col lg:flex-row lg:gap-6 lg:pl-6">
				<div class="bg-color-2/90 sticky top-[var(--nav-h)] z-30 flex items-center gap-2 px-3 py-0.5 lg:hidden print:hidden">
					<button
						class="-ml-3 flex min-w-0 items-center justify-start gap-2 px-3 py-2 text-sm font-medium"
						@click="sidebar_open = true"
					>
						<SlidersHorizontal class="size-5 shrink-0" />
						<span>課表設定</span>
					</button>
				</div>

				<div class="relative flex aspect-[9/16] w-full min-w-0 flex-col lg:aspect-auto lg:min-h-0 lg:flex-1">
					<MyCourseTable
						ref="table"
						class="min-h-0 flex-1 lg:py-2"
						:courses="my_courses"
						:settings="my_style"
						:background="bg_image"
						@course-click="openEdit"
						@empty-click="addAtSlot"
					/>

					<div
						v-if="image_loading"
						class="bg-color-2/70 absolute inset-0 flex items-center justify-center backdrop-blur-sm"
					>
						<InlineLoading text="背景圖片讀取中…" size="size-7" container-class="text-color-9 flex-col gap-3" />
					</div>
				</div>

				<SponsorAd
					narrow
					keep-space
					section-class="w-full shrink-0 pt-4 pb-2 lg:w-60 lg:self-center lg:py-2"
					title-class="px-3 lg:px-0"
					card-class="mx-0 rounded-none md:rounded-none md:border-x-0 lg:rounded-lg lg:border-x-3"
				/>
			</div>
		</div>

		<MyCourseDialog
			v-model:open="dialog_open"
			:course="editing_course"
			:defaults="dialog_defaults"
			:courses="my_courses"
			@submit="submitCourse"
			@remove="removeCourse"
		/>

		<MyCourseImportDialog
			v-model:open="import_dialog_open"
			:courses="my_courses"
			@submit="importCourses"
		/>

		<MyCourseWidgetDialog
			v-model:open="widget_dialog_open"
			:courses="my_courses"
		/>

		<ImagePreviewDialog
			v-model:open="preview_dialog_open"
			title="長按圖片即可儲存"
			:src="preview_url"
			alt="我的課表"
		/>

		<ConfirmDialog
			v-model:open="clear_dialog_open"
			title="清除我的課表中的全部課程？"
			confirm-text="清除"
			confirm-variant="destructive"
			@confirm="clearAll"
		/>

		<MyCourseSyncDialog v-if="show_sync_dialog" :paused="favorite_conflict_open" />
	</div>
</template>
