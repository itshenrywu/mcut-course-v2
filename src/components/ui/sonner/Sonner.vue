<script setup>
import { computed, onMounted } from 'vue'
import { Toaster as Sonner } from 'vue-sonner'
import { CircleCheck, CircleX, TriangleAlert, Info, LoaderCircle } from '@lucide/vue'
import { useTheme } from '@/composables/useTheme'
import { markToasterReady } from '@/components/ui/sonner'
import 'vue-sonner/style.css'

const props = defineProps({
	theme: { type: String, default: undefined }
})

const { mode } = useTheme()
const theme = computed(() => props.theme || (mode.value === 'auto' ? 'system' : mode.value))

onMounted(markToasterReady)
</script>

<template>
	<Sonner
		:theme="theme"
		class="toaster group"
		position="bottom-left"
		:toast-options="{
			classes: {
				toast: 'group toast group-[.toaster]:bg-color-2 group-[.toaster]:text-color-10 group-[.toaster]:border-color-3 group-[.toaster]:shadow-lg',
				description: 'group-[.toast]:text-color-6',
				actionButton: 'group-[.toast]:bg-color-10 group-[.toast]:text-color-1',
				cancelButton: 'group-[.toast]:bg-color-2 group-[.toast]:text-color-6'
			}
		}"
	>
		<template #success-icon>
			<CircleCheck :size="20" />
		</template>
		<template #error-icon>
			<CircleX :size="20" />
		</template>
		<template #warning-icon>
			<TriangleAlert :size="20" />
		</template>
		<template #info-icon>
			<Info :size="20" />
		</template>
		<template #loading-icon>
			<LoaderCircle :size="20" class="animate-spin" />
		</template>
	</Sonner>
</template>

<style>
[data-sonner-toast][data-type='success'] [data-icon] {
	color: var(--color-green-500);
}
[data-sonner-toast][data-type='error'] [data-icon] {
	color: var(--color-red-500);
}
[data-sonner-toast][data-type='warning'] [data-icon] {
	color: var(--color-amber-500);
}
[data-sonner-toast][data-type='info'] [data-icon] {
	color: var(--color-blue-500);
}
</style>
