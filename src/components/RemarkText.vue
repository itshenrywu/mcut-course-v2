<script setup>
import { computed } from 'vue'
import { parseRemark } from '@/lib/remark'

const INDENT_WIDTH = 1.5

const props = defineProps({
	text: {
		type: String,
		default: ''
	}
})

const items = computed(() => parseRemark(props.text))
</script>

<template>
	<div class="flex flex-col gap-1">
		<p
			v-for="(item, index) in items"
			:key="index"
			class="flex gap-1"
			:class="{ 'mt-2': item.gap }"
			:style="{ marginInlineStart: `${item.depth * INDENT_WIDTH}em` }"
		>
			<span v-if="item.marker" class="min-w-[1.5em] shrink-0 text-color-5">{{ item.marker }}</span>
			<span class="min-w-0 flex-1 break-words">
				<span
					v-for="(segment, segment_index) in item.segments"
					:key="segment_index"
					:class="{ 'text-blue-500 font-semibold': segment.highlight }"
				>{{ segment.text }}</span>
			</span>
		</p>
	</div>
</template>
