<script setup>
import { SECTION_ORDER, SECTION_TIME } from '@/lib/course'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'

const open = defineModel('open', { type: Boolean, default: false })
</script>

<template>
	<Dialog v-model:open="open">
		<DialogContent class="max-w-xs">
			<DialogHeader>
				<DialogTitle>各節次對應上課時間</DialogTitle>
				<DialogDescription>部分無固定時間課程會開課在 0.5、4.5、8.5 節，實際上課時間請參考課程詳細資料中的備註或教學進度表</DialogDescription>
			</DialogHeader>
			<div class="flex max-h-[65dvh] flex-col overflow-y-auto overscroll-contain text-sm">
				<div
					v-for="section in SECTION_ORDER"
					:key="section"
					class="flex items-center justify-between gap-4 border-b border-color-3 py-1.5 last:border-b-0"
				>
					<span class="w-8 shrink-0 font-num font-medium text-color-9 tabular-nums">{{ section }}</span>
					<span class="font-num text-color-6 tabular-nums">{{ SECTION_TIME[section][0] }} ~ {{ SECTION_TIME[section][1] }}</span>
				</div>
			</div>
		</DialogContent>
	</Dialog>
</template>
