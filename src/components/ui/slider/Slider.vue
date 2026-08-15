<script setup>
import { SliderRoot, SliderTrack, SliderRange, SliderThumb, useForwardPropsEmits } from 'reka-ui'
import { reactiveOmit } from '@vueuse/core'
import { cn } from '@/lib/utils'

const props = defineProps({
	modelValue: { type: Array, required: false },
	defaultValue: { type: Array, required: false },
	min: { type: Number, default: 0 },
	max: { type: Number, default: 100 },
	step: { type: Number, default: 1 },
	disabled: { type: Boolean, required: false },
	ariaLabel: { type: String, default: '' },
	class: { type: null, default: '' },
	trackClass: { type: null, default: '' },
	trackStyle: { type: null, default: undefined },
	rangeClass: { type: null, default: '' },
	thumbClass: { type: null, default: '' },
	thumbStyle: { type: null, default: undefined }
})
const emits = defineEmits(['update:modelValue', 'valueCommit'])

const delegated_props = reactiveOmit(props, 'class', 'trackClass', 'trackStyle', 'rangeClass', 'thumbClass', 'thumbStyle', 'ariaLabel')
const forwarded = useForwardPropsEmits(delegated_props, emits)
</script>

<template>
	<SliderRoot
		data-slot="slider"
		v-bind="forwarded"
		:class="cn('relative flex w-full touch-none items-center select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50', props.class)"
	>
		<SliderTrack
			:class="cn('bg-color-3 relative h-1.5 w-full grow overflow-hidden rounded-full', trackClass)"
			:style="trackStyle"
		>
			<SliderRange :class="cn('bg-color-10 absolute h-full', rangeClass)" />
		</SliderTrack>
		<SliderThumb
			v-for="(_, index) in (modelValue || defaultValue || [])"
			:key="index"
			:aria-label="ariaLabel"
			:class="cn('border-color-1 bg-color-10 ring-color-5/50 block size-4 shrink-0 rounded-full border-2 shadow-sm outline-hidden focus-visible:ring-[3px]', thumbClass)"
			:style="thumbStyle"
		/>
	</SliderRoot>
</template>
