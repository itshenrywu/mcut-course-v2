<script setup>
import { Primitive } from 'reka-ui'
import { cn } from '@/lib/utils'
import { buttonVariants } from '.'

const props = defineProps({
	variant: { type: String, default: 'default' },
	size: { type: String, default: 'default' },
	as: { type: String, default: 'button' },
	class: { type: null, default: '' }
})
</script>

<template>
	<Primitive
		:as="as"
		:class="cn(buttonVariants({ variant, size }), props.class)"
	>
		<slot />
	</Primitive>
</template>
