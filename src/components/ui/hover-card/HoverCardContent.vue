<script setup>
import { HoverCardContent, HoverCardPortal, useForwardProps } from 'reka-ui'
import { cn } from '@/lib/utils'

const props = defineProps({
	class: { type: null, default: '' },
	align: { type: String, default: 'center' },
	side: { type: String, default: 'bottom' },
	sideOffset: { type: Number, default: 4 },
	collisionPadding: { type: null, default: 8 },
	disablePortal: { type: Boolean, default: false }
})

const { class: _, disablePortal: __, ...delegated } = props
const forwarded = useForwardProps(delegated)
</script>

<template>
	<HoverCardPortal :disabled="disablePortal">
		<HoverCardContent
			data-slot="hover-card-content"
			v-bind="forwarded"
			:class="cn('bg-color-1 text-color-10 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 w-64 max-h-(--reka-hover-card-content-available-height) overflow-y-auto overscroll-contain origin-(--reka-hover-card-content-transform-origin) rounded-md border p-4 shadow-md outline-hidden', props.class)"
		>
			<slot />
		</HoverCardContent>
	</HoverCardPortal>
</template>
