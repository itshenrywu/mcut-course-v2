<script setup>
import { SearchX } from '@lucide/vue'
import { RouterLink } from 'vue-router'
import StateBlock from '@/components/StateBlock.vue'
import { buttonVariants } from '@/components/ui/button'

defineProps({
	title: {
		type: String,
		default: ''
	},
	description: {
		type: String,
		default: ''
	},
	linkTo: {
		type: String,
		default: '/'
	},
	linkText: {
		type: String,
		default: '回首頁'
	}
})
</script>

<template>
	<StateBlock :icon="SearchX" :title="title" :description="description" :level="1" container-class="flex-1 py-24">
		<template #extra>
			<RouterLink :to="linkTo" :class="[buttonVariants(), 'mt-2']">{{ linkText }}</RouterLink>
		</template>
	</StateBlock>
</template>
