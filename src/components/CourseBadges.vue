<script setup>
import { computed } from 'vue'
import EnrollBadge from '@/components/EnrollBadge.vue'
import { Badge } from '@/components/ui/badge'
import { isPeElectiveCourse } from '@/lib/course'

const props = defineProps({
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

const is_pe_elective = computed(() => isPeElectiveCourse(props.course))
</script>

<template>
	<EnrollBadge :type="course.enroll_type" />
	<Badge v-if="generalType && course.general_type" variant="outline">通識 - {{ course.general_type }}</Badge>
	<Badge v-if="is_pe_elective" variant="outline">體育自選</Badge>
	<span :class="creditClass">{{ course.credit }} 學分</span>
	<slot />
</template>
