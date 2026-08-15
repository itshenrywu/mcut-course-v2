<script setup>
import { DialogOverlay, injectDialogRootContext } from 'reka-ui'
import { cn } from '@/lib/utils'
import { trackOverlay } from '@/lib/overlay'

const props = defineProps({
	class: { type: null, default: '' }
})

trackOverlay(injectDialogRootContext().open)
</script>

<template>
	<DialogOverlay
		data-slot="dialog-overlay"
		:class="cn('data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/50', props.class)"
	>
		<slot />
	</DialogOverlay>
</template>
