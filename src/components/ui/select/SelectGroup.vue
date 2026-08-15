<script setup>
import { SelectGroup } from 'reka-ui'
import { cn } from '@/lib/utils'

const props = defineProps({
	class: { type: null, default: '' }
})
</script>

<template>
	<SelectGroup data-slot="select-group" :class="cn('py-1', props.class)">
		<slot />
	</SelectGroup>
</template>
