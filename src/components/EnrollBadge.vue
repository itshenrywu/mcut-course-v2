<script setup>
import { Badge } from '@/components/ui/badge'
import { ENROLL_TYPE_CLASSES } from '@/lib/course'

const props = defineProps({
	type: { type: String, default: '' },
	class: { type: null, default: '' }
})
</script>

<template>
	<Badge
		variant="secondary"
		:class="['border-transparent', ENROLL_TYPE_CLASSES[type] || ENROLL_TYPE_CLASSES.DEFAULT, props.class]"
	>
		<slot>{{ type }}</slot>
	</Badge>
</template>
