<script setup>
import { computed } from 'vue'
import { Sun, Moon } from '@lucide/vue'
import { Button } from '@/components/ui/button'
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
	<Button
		v-if="!overlay_open"
		variant="outline"
		size="icon"
		:title="`主題:${current.label}`"
		:aria-label="`切換主題,目前為${current.label}`"
		class="fixed right-3 bottom-3 z-50 size-8 text-color-6 shadow-md print:hidden"
		@click="cycleTheme"
	>
		<component :is="current.icon" class="size-5" />
	</Button>
</template>
