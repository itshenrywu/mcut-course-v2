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
		<div class="bg-color-2/50 flex items-center justify-between" :class="compact ? 'px-3 py-1.5' : 'px-5 py-2'">
			<p class="text-color-6 text-xs font-medium">搜尋紀錄</p>
			<button type="button" class="text-color-6 hover:text-color-10 text-xs" @click="clearSearchHistory()">全部刪除</button>
		</div>
		<div
			v-for="item in search_history"
			:key="item"
			class="hover:bg-color-2 flex items-center"
			:class="compact ? 'px-3' : 'px-5'"
		>
			<button
				type="button"
				class="flex min-w-0 flex-1 items-center gap-2 text-left"
				:class="compact ? 'py-1.5 text-sm' : 'py-3 text-base'"
				@click="emit('select', item)"
			>
				<Clock class="text-color-6 size-3.5 shrink-0" />
				<span class="truncate">{{ item }}</span>
			</button>
			<button
				type="button"
				class="text-color-6 hover:text-color-9 shrink-0 p-1"
				:aria-label="`刪除搜尋紀錄 ${item}`"
				@click="removeSearchHistory(item)"
			>
				<X class="size-3.5" />
			</button>
		</div>
	</div>
</template>
