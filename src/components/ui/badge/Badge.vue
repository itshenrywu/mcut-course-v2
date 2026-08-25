<script setup>
import { Primitive } from 'reka-ui'
import { cn } from '@/lib/utils'
import { badgeVariants } from '.'

const props = defineProps({
	variant: { type: String, default: 'default' },
	size: { type: String, default: 'default' },
	as: { type: String, default: 'span' },
	class: { type: null, default: '' }
})
</script>

<template>
	<Primitive
		:as="as"
		data-slot="badge"
		:class="cn(badgeVariants({ variant, size }), props.class)"
	>
		<slot />
	</Primitive>
</template>
