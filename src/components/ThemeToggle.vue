<script setup>
import { computed } from 'vue'
import { Sun, Moon } from '@lucide/vue'
import { useTheme } from '@/composables/useTheme'
import { useDevice } from '@/composables/useDevice'
import { overlay_open } from '@/lib/overlay'

const { mode, cycleTheme } = useTheme()
const { device_icon } = useDevice()

const theme_meta = computed(() => ({
	auto: { icon: device_icon.value, label: '跟隨系統' },
	light: { icon: Sun, label: '淺色' },
	dark: { icon: Moon, label: '深色' }
}))

const current = computed(() => theme_meta.value[mode.value])
</script>

<template>
	<button
		v-if="!overlay_open"
		type="button"
		:title="`主題:${current.label}`"
		:aria-label="`切換主題,目前為${current.label}`"
		class="fixed bottom-3 right-3 z-50 border bg-color-2 shadow-md print:hidden flex size-8 items-center justify-center rounded-md text-color-6 hover:bg-color-2 hover:text-color-10"
		@click="cycleTheme"
	>
		<component :is="current.icon" class="size-5" />
	</button>
</template>
