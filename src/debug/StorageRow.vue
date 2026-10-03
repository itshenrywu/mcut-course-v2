<script setup>
import { ref } from 'vue'
import { ChevronDown, Trash2 } from '@lucide/vue'

defineProps({
	label: {
		type: String,
		default: ''
	},
	meta: {
		type: String,
		default: ''
	},
	expandable: {
		type: Boolean,
		default: false
	}
})

const emit = defineEmits(['remove'])

const open = ref(false)
</script>

<template>
	<div>
		<div class="flex items-center hover:bg-color-3">
			<component
				:is="expandable ? 'button' : 'div'"
				:type="expandable ? 'button' : undefined"
				:aria-expanded="expandable ? open : undefined"
				class="flex min-w-0 flex-1 items-center gap-2 py-2.5 pl-4 text-left"
				@click="open = expandable && !open"
			>
				<span class="flex min-w-0 flex-1 flex-col">
					<span class="truncate font-mono text-sm">{{ label }}</span>
					<span v-if="meta" class="truncate font-num text-xs text-color-6 tabular-nums">{{ meta }}</span>
				</span>
				<ChevronDown v-if="expandable" class="size-3.5 shrink-0 text-color-5 transition-transform" :class="open && 'rotate-180'" />
			</component>
			<button type="button" class="shrink-0 py-2.5 pr-4 pl-3 text-color-5 hover:text-destructive" :aria-label="`刪除 ${label}`" @click="emit('remove')">
				<Trash2 class="size-3.5" />
			</button>
		</div>
		<div v-if="open" class="px-4 pb-3">
			<slot />
		</div>
	</div>
</template>
