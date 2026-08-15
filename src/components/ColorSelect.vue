<script setup>
import { computed, ref, watch, useTemplateRef } from 'vue'
import { ChevronDown, ImagePlus } from '@lucide/vue'
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import FilterField from '@/components/FilterField.vue'
import ColorPicker from '@/components/ColorPicker.vue'

const DEFAULT_CUSTOM_COLOR = '#eff3ff'

const props = defineProps({
	label: {
		type: String,
		default: ''
	},
	options: {
		type: Array,
		default: () => []
	},
	imageEnabled: {
		type: Boolean,
		default: false
	},
	imageLabel: {
		type: String,
		default: '圖片'
	},
	imageUrl: {
		type: String,
		default: ''
	}
})

const model = defineModel({ type: String, default: '' })
const use_image = defineModel('image', { type: Boolean, default: false })
const last_custom = defineModel('custom', { type: String, default: '' })

const emit = defineEmits(['pick-image', 'remove-image'])

const file_ref = useTemplateRef('file')

const open = ref(false)
const show_picker = ref(false)

const current = computed(() => props.options.find(option => option.value === model.value) || null)
const is_custom = computed(() => !use_image.value && !current.value)
const trigger_label = computed(() => use_image.value ? props.imageLabel : current.value ? current.value.label : '自訂顏色')
const trigger_style = computed(() => use_image.value && props.imageUrl ? { backgroundImage: `url(${props.imageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' } : { background: model.value })
const saved_custom = computed(() => props.options.some(option => option.value === last_custom.value) ? '' : last_custom.value)
const custom_color = computed({
	get: () => is_custom.value ? model.value : saved_custom.value || DEFAULT_CUSTOM_COLOR,
	set: value => {
		model.value = value
		last_custom.value = value
		use_image.value = false
	}
})

const custom_swatch = computed(() => is_custom.value || saved_custom.value ? custom_color.value : 'conic-gradient(from 0deg, #f43f5e, #f59e0b, #22c55e, #06b6d4, #6366f1, #f43f5e)')

watch(open, value => {
	if (value) show_picker.value = is_custom.value
})

function selectPreset(value) {
	model.value = value
	use_image.value = false
	open.value = false
}

function selectCustom() {
	const color = custom_color.value
	model.value = color
	last_custom.value = color
	use_image.value = false
	show_picker.value = true
}

function openFile() {
	file_ref.value?.click()
}

function selectImage() {
	if (!props.imageUrl) {
		openFile()
		return
	}
	use_image.value = true
	open.value = false
}

function changeImage(event) {
	const file = event.target.files?.[0]
	event.target.value = ''
	if (!file) return
	emit('pick-image', file)
	open.value = false
}

function removeImage() {
	emit('remove-image')
}
</script>

<template>
	<FilterField :label="label">
		<Popover v-model:open="open">
			<PopoverTrigger
				class="border-color-3 bg-color-1 focus-visible:border-color-5 focus-visible:ring-color-5/50 flex h-9 w-full items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-[3px]"
				:aria-label="label"
			>
				<span class="flex min-w-0 items-center gap-2">
					<span class="border-color-4 size-4 shrink-0 rounded-full border" :style="trigger_style"></span>
					<span class="truncate">{{ trigger_label }}</span>
				</span>
				<ChevronDown class="size-4 shrink-0 opacity-50" />
			</PopoverTrigger>
			<PopoverContent align="start" class="w-(--reka-popover-trigger-width) min-w-56 p-3">
				<div class="flex flex-col gap-3">
					<div class="grid grid-cols-2 gap-2">
						<button
							v-for="option in options"
							:key="option.value"
							type="button"
							class="border-color-3 inset-ring-color-10 flex items-center gap-2 rounded-md border px-2 py-1.5 text-sm"
							:class="!use_image && model === option.value ? 'inset-ring-2' : ''"
							@click="selectPreset(option.value)"
						>
							<span class="border-color-4 size-4 shrink-0 rounded-full border" :style="{ background: option.value }"></span>
							<span class="truncate">{{ option.label }}</span>
						</button>
						<button
							type="button"
							class="border-color-3 inset-ring-color-10 flex items-center gap-2 rounded-md border px-2 py-1.5 text-sm"
							:class="[is_custom ? 'inset-ring-2' : '', imageEnabled ? '' : 'col-span-2']"
							@click="selectCustom"
						>
							<span class="border-color-4 size-4 shrink-0 rounded-full border" :style="{ background: custom_swatch }"></span>
							<span class="truncate">自訂</span>
						</button>
						<button
							v-if="imageEnabled"
							type="button"
							class="border-color-3 inset-ring-color-10 flex items-center gap-2 rounded-md border px-2 py-1.5 text-sm"
							:class="use_image ? 'inset-ring-2' : ''"
							@click="selectImage"
						>
							<span
								v-if="imageUrl"
								class="border-color-4 size-4 shrink-0 rounded-full border bg-cover bg-center"
								:style="{ backgroundImage: `url(${imageUrl})` }"
							></span>
							<ImagePlus v-else class="text-color-6 size-4 shrink-0" />
							<span class="truncate">{{ imageLabel }}</span>
						</button>
					</div>

					<template v-if="use_image">
						<div class="grid grid-cols-2 gap-2">
							<Button variant="secondary" size="sm" @click="openFile">更換圖片</Button>
							<Button variant="destructive-ghost" size="sm" @click="removeImage">移除圖片</Button>
						</div>
					</template>
					<template v-else-if="show_picker">
						<div class="border-color-3 border-t"></div>
						<ColorPicker v-model="custom_color" />
					</template>
				</div>
			</PopoverContent>
		</Popover>
		<input ref="file" type="file" accept="image/*" class="hidden" @change="changeImage" />
	</FilterField>
</template>
