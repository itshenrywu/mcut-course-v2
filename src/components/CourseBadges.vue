<script setup>
import EnrollBadge from '@/components/EnrollBadge.vue'
import { Badge } from '@/components/ui/badge'

defineProps({
	course: {
		type: Object,
		required: true
	},
	generalType: {
		type: Boolean,
		default: true
	},
	creditClass: {
		type: String,
		default: ''
	}
})
</script>

<template>
	<EnrollBadge :type="course.enroll_type" />
	<Badge v-if="generalType && course.general_type" variant="outline">通識 - {{ course.general_type }}</Badge>
	<span :class="creditClass">{{ course.credit }} 學分</span>
	<slot />
</template>
