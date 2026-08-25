<script setup>
import { MapPin, GraduationCap } from '@lucide/vue'
import { formatDateRange, EVENT_DOT_CLASSES, EVENT_TEXT_CLASSES } from '@/lib/calendar'

defineProps({
	groups: {
		type: Array,
		default: () => []
	},
	showDate: {
		type: Boolean,
		default: true
	}
})
</script>

<template>
	<div class="flex flex-col divide-y">
		<section v-for="group in groups" :key="group.key" class="flex flex-col gap-2 px-4 py-3">
			<h3 v-if="showDate" class="text-xs" :class="group.is_today ? 'text-color-10 font-medium' : 'text-color-6'">
				{{ group.label }}<template v-if="group.is_today">・今天</template>
			</h3>
			<article v-for="event in group.events" :key="event.id" class="flex gap-2.5">
				<span class="mt-1.5 size-2 shrink-0 rounded-full" :class="EVENT_DOT_CLASSES[event.tone]" />
				<div class="flex min-w-0 flex-1 flex-col gap-0.5">
					<p class="text-sm leading-snug font-medium" :class="EVENT_TEXT_CLASSES[event.tone]">{{ event.summary }}</p>
					<p
						v-if="event.start_key !== event.end_key || event.time_text || event.location || event.group_text"
						class="flex flex-wrap items-center gap-x-2 text-xs text-color-6"
					>
						<span v-if="event.start_key !== event.end_key" class="font-num tabular-nums">{{ formatDateRange(event) }}</span>
						<span v-if="event.time_text" class="font-num tabular-nums">{{ event.time_text }}</span>
						<span v-if="event.group_text" class="inline-flex items-center gap-0.5">
							<GraduationCap class="size-3 shrink-0" />
							{{ event.group_text }}
						</span>
						<span v-if="event.location" class="inline-flex items-center gap-0.5">
							<MapPin class="size-3 shrink-0" />
							{{ event.location }}
						</span>
					</p>
					<p
						v-if="event.description"
						class="mt-0.5 text-xs leading-relaxed whitespace-pre-line text-color-7 [&_a]:text-color-10 [&_a]:underline [&_a]:underline-offset-2"
						v-html="event.description"
					/>
				</div>
			</article>
		</section>
	</div>
</template>
