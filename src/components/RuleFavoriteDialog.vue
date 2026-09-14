<script setup>
import { computed, ref, watch } from 'vue'
import { Star } from '@lucide/vue'
import { findRule, findDept, parseRuleFavoriteId, ruleDisplayName } from '@/lib/rule'
import { useRuleFavorite } from '@/lib/rule-favorite'
import { spaceText } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import CourseListDialog from '@/components/CourseListDialog.vue'
import ConfirmDialog from '@/components/ConfirmDialog.vue'

const props = defineProps({
	ruleMap: {
		type: Object,
		default: () => ({})
	},
	deptMap: {
		type: Object,
		default: () => ({})
	},
	activeId: {
		type: String,
		default: ''
	},
	disabled: {
		type: Boolean,
		default: false
	}
})

const emit = defineEmits(['select'])

const { rule_favorite_ids, removeRuleFavorite } = useRuleFavorite()

const dialog_open = ref(false)
const remove_dialog_open = ref(false)
const remove_entry = ref(null)

// 已下架 (解析不到) 的收藏直接不顯示; 總表清單還沒載入時每一筆都解析不到, 所以整份先當空的
const entries = computed(() => Object.keys(props.ruleMap).length
	? rule_favorite_ids.value
		.map(id => {
			const parsed = parseRuleFavoriteId(id)
			if (!parsed) return null
			const { year, dept_id, rule_id } = parsed
			const rule = findRule(props.ruleMap, props.deptMap, year, dept_id, rule_id)
			if (!rule) return null
			const dept_name = findDept(props.deptMap, year, dept_id)?.name || ''
			const program = ['跨領域', '第二專長'].includes(rule.type)
			return {
				id,
				year,
				dept_id,
				rule_id,
				title: spaceText(ruleDisplayName(rule)),
				description: program && dept_name ? `${year} 學年 ${dept_name}入學` : `${year} 學年入學`
			}
		})
		.filter(Boolean)
	: [])

function select(entry) {
	dialog_open.value = false
	emit('select', entry)
}

function askRemove(entry) {
	remove_entry.value = entry
	remove_dialog_open.value = true
}

function confirmRemove() {
	removeRuleFavorite(remove_entry.value.id)
}

watch(entries, list => {
	if (!list.length) dialog_open.value = false
})
</script>

<template>
	<Button
		v-if="entries.length"
		variant="outline"
		size="sm"
		class="w-full justify-start bg-color-1 has-[>svg]:px-3 hover:bg-color-2"
		:disabled="disabled"
		@click="dialog_open = true"
	>
		<Star />
		收藏的總表
		<span class="ml-auto flex w-4 justify-center font-num text-xs text-color-6 tabular-nums">{{ entries.length }}</span>
	</Button>

	<CourseListDialog v-model:open="dialog_open" title="收藏的總表" :count="entries.length">
		<div v-for="entry in entries" :key="entry.id" class="relative">
			<button
				type="button"
				class="flex w-full flex-col gap-0.5 rounded-md px-2 py-2 pr-10 text-left"
				:class="entry.id === activeId ? 'bg-color-3' : 'hover:bg-color-2'"
				@click="select(entry)"
			>
				<span class="text-xs text-color-6">{{ entry.description }}</span>
				<span class="font-medium">{{ entry.title }}</span>
			</button>
			<button
				type="button"
				class="absolute inset-y-0 right-0 flex items-center px-3"
				:aria-label="`取消收藏 ${entry.title}`"
				@click="askRemove(entry)"
			>
				<Star class="size-4 shrink-0 fill-amber-400 text-amber-400" />
			</button>
		</div>
	</CourseListDialog>

	<ConfirmDialog
		v-model:open="remove_dialog_open"
		:title="`取消收藏「${remove_entry?.title}」？`"
		confirm-text="取消收藏"
		cancel-text="保留"
		@confirm="confirmRemove()"
	/>
</template>
