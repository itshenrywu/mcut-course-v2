<script setup>
import { ref, computed, watch } from 'vue'
import { colord } from 'colord'
import { Input } from '@/components/ui/input'
import { Slider } from '@/components/ui/slider'

const model = defineModel({ type: String, default: '#000000' })

const hsv = ref(toHsv(model.value))
const hex_text = ref(model.value)

let dragging = false

const hue = computed({
	get: () => [hsv.value.h],
	set: ([value]) => setHsv({ h: value })
})

const hue_color = computed(() => colord({ h: hsv.value.h, s: 100, v: 100 }).toHex())
const hue_track_style = computed(() => ({ background: `linear-gradient(to right, ${[0, 60, 120, 180, 240, 300, 360].map(deg => `hsl(${deg} 100% 50%)`).join(', ')})` }))
const hue_thumb_style = computed(() => ({ background: hue_color.value }))
const panel_style = computed(() => ({ background: `linear-gradient(to top, #000, transparent), linear-gradient(to right, #fff, transparent), ${hue_color.value}` }))
const panel_thumb_style = computed(() => ({ left: `${hsv.value.s}%`, top: `${100 - hsv.value.v}%`, background: model.value }))

watch(model, value => {
	if (colord(value).toHex() !== colord(hsv.value).toHex()) hsv.value = toHsv(value, hsv.value.h)
	if (!isSameColor(hex_text.value, value)) hex_text.value = value
})

watch(hex_text, value => {
	const text = value.trim()
	const hex = text.startsWith('#') ? text : `#${text}`
	if (!colord(hex).isValid()) return
	model.value = colord(hex).toHex()
})

function toHsv(value, fallback_hue = 0) {
	const next = colord(value).toHsv()
	if (next.s === 0) next.h = fallback_hue
	return next
}

function isSameColor(a, b) {
	return colord(a).isValid() && colord(a).toHex() === colord(b).toHex()
}

function setHsv(patch) {
	hsv.value = { ...hsv.value, ...patch }
	model.value = colord(hsv.value).toHex()
}

function clamp(value) {
	return Math.min(Math.max(value, 0), 1)
}

function updatePanel(event) {
	const rect = event.currentTarget.getBoundingClientRect()
	setHsv({
		s: clamp((event.clientX - rect.left) / rect.width) * 100,
		v: (1 - clamp((event.clientY - rect.top) / rect.height)) * 100
	})
}

function startPanel(event) {
	dragging = true
	event.currentTarget.setPointerCapture(event.pointerId)
	updatePanel(event)
}

function movePanel(event) {
	if (!dragging) return
	updatePanel(event)
}

function endPanel(event) {
	dragging = false
	if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId)
}

function normalizeHex() {
	hex_text.value = model.value
}
</script>

<template>
	<div class="flex flex-col gap-3">
		<div
			class="relative h-32 w-full cursor-crosshair touch-none rounded-md border border-color-3 select-none"
			:style="panel_style"
			@pointerdown="startPanel"
			@pointermove="movePanel"
			@pointerup="endPanel"
			@pointercancel="endPanel"
		>
			<span
				class="pointer-events-none absolute size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-[0_0_0_1px_rgba(0,0,0,0.3)]"
				:style="panel_thumb_style"
			></span>
		</div>

		<Slider
			v-model="hue"
			:max="360"
			:step="1"
			aria-label="色相"
			track-class="h-3 rounded-full"
			:track-style="hue_track_style"
			range-class="bg-transparent"
			thumb-class="size-5 border-white shadow-[0_0_0_1px_rgba(0,0,0,0.3)]"
			:thumb-style="hue_thumb_style"
		/>

		<div class="flex items-center gap-2">
			<span class="size-6 shrink-0 rounded-full border border-color-4" :style="{ background: model }"></span>
			<Input
				v-model="hex_text"
				class="h-8 font-mono uppercase"
				maxlength="7"
				spellcheck="false"
				autocapitalize="off"
				autocomplete="off"
				aria-label="色碼"
				@blur="normalizeHex"
			/>
		</div>
	</div>
</template>
