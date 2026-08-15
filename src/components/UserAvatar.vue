<script setup>
import { cn } from '@/lib/utils'

defineProps({
	src: {
		type: String,
		default: ''
	},
	size: {
		type: String,
		default: 'size-10'
	}
})
</script>

<template>
	<img :src="src || '/image/profile.png'" alt="" :class="cn('shrink-0 rounded-full object-cover', size)" />
</template>
