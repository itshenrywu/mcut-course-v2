<script setup>
import { TabsList } from 'reka-ui'
import { reactiveOmit } from '@vueuse/core'
import { cn } from '@/lib/utils'

const props = defineProps({
	loop: { type: Boolean, required: false },
	class: { type: null, default: '' }
})

const delegated_props = reactiveOmit(props, 'class')
</script>

<template>
	<TabsList
		data-slot="tabs-list"
		v-bind="delegated_props"
		:class="cn('bg-color-2 text-color-6 inline-flex h-9 w-fit items-center justify-center rounded-lg p-0.75', props.class)"
	>
		<slot />
	</TabsList>
</template>
