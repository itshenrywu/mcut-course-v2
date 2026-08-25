<script setup>
import { Clock, X } from '@lucide/vue'
import { useSearchHistory } from '@/lib/search-history'

defineProps({
	compact: {
		type: Boolean,
		default: false
	}
})

const emit = defineEmits(['select'])

const { search_history, removeSearchHistory, clearSearchHistory } = useSearchHistory()
</script>

<template>
	<div v-if="search_history.length">
		<div class="flex items-center justify-between bg-color-2/50" :class="compact ? 'px-3 py-1.5' : 'px-5 py-2'">
			<p class="text-xs font-medium text-color-6">搜尋紀錄</p>
			<button type="button" class="text-xs text-color-6 hover:text-color-10" @click="clearSearchHistory()">全部刪除</button>
		</div>
		<div
			v-for="item in search_history"
			:key="item"
			class="flex items-center transition-colors hover:bg-color-2"
			:class="compact ? 'px-3' : 'px-5'"
		>
			<button
				type="button"
				class="flex min-w-0 flex-1 items-center gap-2 text-left"
				:class="compact ? 'py-1.5 text-sm' : 'py-3 text-base'"
				@click="emit('select', item)"
			>
				<Clock class="size-3.5 shrink-0 text-color-6" />
				<span class="truncate">{{ item }}</span>
			</button>
			<button
				type="button"
				class="shrink-0 p-1 text-color-6 hover:text-color-9"
				:aria-label="`刪除搜尋紀錄 ${item}`"
				@click="removeSearchHistory(item)"
			>
				<X class="size-3.5" />
			</button>
		</div>
	</div>
</template>
