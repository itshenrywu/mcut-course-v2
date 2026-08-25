<script setup>
import { FULL_WEEKDAY_LABELS } from '@/lib/course-format'
import { EVENT_GRID_CLASSES } from '@/lib/calendar'

defineProps({
	weeks: {
		type: Array,
		default: () => []
	},
	selectedKey: {
		type: String,
		default: ''
	}
})

const emit = defineEmits(['select'])
</script>

<template>
	<div class="-mx-4 flex flex-col border border-x-0 bg-color-1 md:mx-0 md:rounded-lg md:border-x">
		<div class="grid grid-cols-7 border-b">
			<div v-for="(label, index) in FULL_WEEKDAY_LABELS" :key="label" class="py-1.5 text-center text-xs" :class="index === 0 || index === 6 ? 'text-color-5' : 'text-color-6'">
				{{ label }}
			</div>
		</div>

		<div v-for="week in weeks" :key="week.key" class="relative border-b py-1 last:border-b-0">
			<div class="absolute inset-0 grid grid-cols-7">
				<button
					v-for="day in week.days"
					:key="day.key"
					type="button"
					class="hover:bg-color-2/60"
					:class="day.key === selectedKey && 'bg-color-2/60'"
					:aria-label="day.key"
					:aria-pressed="day.key === selectedKey"
					@click="emit('select', day.key)"
				/>
			</div>

			<div class="pointer-events-none relative flex flex-col gap-0.5">
				<div class="grid grid-cols-7">
					<span
						v-for="day in week.days"
						:key="day.key"
						class="mx-auto grid size-6 place-items-center rounded-full font-num text-xs tabular-nums"
						:class="[
							day.is_today ? 'bg-color-10 text-color-1 font-medium' : day.in_month ? 'text-color-9' : 'text-color-5',
							!day.is_today && day.key === selectedKey && 'ring-color-6 ring-1'
						]"
					>{{ day.label }}</span>
				</div>

				<div class="flex flex-col gap-0.5 px-0.5 md:px-1">
					<div v-for="(lane, index) in week.lanes" :key="index" class="grid min-h-[22px] grid-cols-7 gap-px md:gap-0.5">
						<span
							v-for="item in lane"
							:key="item.event.id"
							class="flex items-center overflow-hidden rounded border px-0.5 py-0.5 text-[9px] leading-4 md:px-1 md:text-[11px]"
							:class="[
								EVENT_GRID_CLASSES[item.event.tone],
								!item.is_start && 'rounded-l-none border-l-0',
								!item.is_end && 'rounded-r-none border-r-0'
							]"
							:style="{ gridColumn: `${item.col} / span ${item.span}` }"
						>
							<span class="truncate">{{ item.event.summary }}</span>
						</span>
					</div>
				</div>
			</div>
		</div>
	</div>
</template>
