<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { ChevronLeft, ChevronRight, CalendarDays, List } from '@lucide/vue'
import { useCalendarMonth, buildWeeks, groupByDay, calendarOptions, filterByCategory, DEFAULT_CATEGORY, monthRange, formatDayLabel } from '@/lib/calendar'
import { useLocalRef } from '@/lib/storage'
import LoadingOverlay from '@/components/LoadingOverlay.vue'
import LoadError from '@/components/LoadError.vue'
import InlineLoading from '@/components/InlineLoading.vue'
import PageContainer from '@/components/PageContainer.vue'
import SectionCard from '@/components/SectionCard.vue'
import SponsorAd from '@/components/SponsorAd.vue'
import EmptyHint from '@/components/EmptyHint.vue'
import ViewModeTabs from '@/components/ViewModeTabs.vue'
import CalendarMonthGrid from '@/components/CalendarMonthGrid.vue'
import CalendarEventList from '@/components/CalendarEventList.vue'
import { Button } from '@/components/ui/button'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'

const CALENDAR_VIEW_MODES = [
	{ value: 'month', label: '月曆', icon: CalendarDays },
	{ value: 'list', label: '清單', icon: List }
]

const { today, year, month, month_key, month_label, is_current_month, calendars, events, loading, loaded, load_error, loadMonth, goMonth, goToday } = useCalendarMonth()

const view_mode = useLocalRef('mcv2-calendar-view', 'month', undefined, v => ['month', 'list'].includes(v))

const category = useLocalRef('mcv2-calendar-category', DEFAULT_CATEGORY)

const selected_key = ref(today)

watch(month_key, key => {
	selected_key.value = key === today.slice(0, 7) ? today : ''
})

onMounted(() => loadMonth())

const category_options = computed(() => calendarOptions(calendars.value))

watch(category_options, options => {
	if (options.length && !options.some(option => option.value === category.value)) category.value = options[0].value
})

const visible_events = computed(() => filterByCategory(events.value, category.value))

const weeks = computed(() => buildWeeks(year.value, month.value, visible_events.value))

const month_groups = computed(() => groupByDay(visible_events.value, ...monthRange(year.value, month.value)))

const selected_groups = computed(() => selected_key.value ? groupByDay(visible_events.value, selected_key.value, selected_key.value) : [])
</script>

<template>
	<LoadingOverlay v-if="loading && !loaded" text="行事曆讀取中…" />
	<LoadError v-else-if="load_error" title="行事曆讀取失敗" @retry="loadMonth({ force: true })" />

	<PageContainer title="行事曆" container-class="max-w-5xl gap-4">
		<div class="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
			<Select v-model="category">
				<SelectTrigger size="sm" class="bg-color-1 max-w-full min-w-0 justify-self-start text-xs" aria-label="行事曆分類">
					<SelectValue placeholder="選擇分類" />
				</SelectTrigger>
				<SelectContent align="start">
					<SelectItem
						v-for="option in category_options"
						:key="option.value"
						:value="option.value"
						:description="option.description"
					>{{ option.label }}</SelectItem>
				</SelectContent>
			</Select>

			<div class="flex items-center gap-1">
				<Button variant="ghost" size="icon" aria-label="上個月" @click="goMonth(-1)">
					<ChevronLeft />
				</Button>
				<span class="font-num min-w-16 text-center font-medium tabular-nums">{{ month_label }}</span>
				<Button size="sm" :disabled="is_current_month" class="h-6 rounded-full px-2 text-xs" @click="goToday">回本月</Button>
				<Button variant="ghost" size="icon" aria-label="下個月" @click="goMonth(1)">
					<ChevronRight />
				</Button>
			</div>

			<ViewModeTabs v-model="view_mode" :modes="CALENDAR_VIEW_MODES" compact root-class="justify-self-end" />
		</div>

		<InlineLoading v-if="loading" container-class="py-16" text="行事曆讀取中…" />

		<template v-else-if="view_mode === 'month'">
			<CalendarMonthGrid :weeks="weeks" :selected-key="selected_key" @select="selected_key = $event" />

			<SectionCard v-if="selected_key" :title="formatDayLabel(selected_key)" card-class="py-1">
				<CalendarEventList v-if="selected_groups.length" :groups="selected_groups" :show-date="false" />
				<p v-else class="text-color-6 px-4 py-3 text-sm">這天沒有活動</p>
			</SectionCard>
		</template>

		<SectionCard v-else card-class="py-1">
			<CalendarEventList v-if="month_groups.length" :groups="month_groups" />
			<EmptyHint v-else>{{ month_label }} 沒有活動</EmptyHint>
		</SectionCard>

		<SponsorAd v-if="!loading" />
	</PageContainer>
</template>
