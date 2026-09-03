<script setup>
import { ComboboxAnchor, ComboboxTrigger } from 'reka-ui'
import { ChevronDown } from '@lucide/vue'
import { cn } from '@/lib/utils'

const props = defineProps({
	size: { type: String, default: 'default' },
	disabled: { type: Boolean, required: false },
	class: { type: null, default: '' }
})
</script>

<template>
	<ComboboxAnchor as-child>
		<ComboboxTrigger
			data-slot="combobox-trigger"
			:data-size="size"
			:disabled="disabled"
			:class="cn('border-color-3 [&_svg:not([class*=\'text-\'])]:text-color-6 focus-visible:border-color-5 focus-visible:ring-color-5/50 flex w-fit items-center justify-between gap-2 rounded-md border bg-transparent px-3 py-2 text-sm whitespace-nowrap shadow-xs outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 data-[size=default]:h-9 data-[size=sm]:h-8 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*=\'size-\'])]:size-4', props.class)"
		>
			<span class="line-clamp-1 min-w-0 flex-1 text-left">
				<slot />
			</span>
			<ChevronDown class="size-4 shrink-0 opacity-50" />
		</ComboboxTrigger>
	</ComboboxAnchor>
</template>
