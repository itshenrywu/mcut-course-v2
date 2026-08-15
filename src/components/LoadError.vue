<script setup>
import { CloudAlert } from '@lucide/vue'
import { useRoute, useRouter } from 'vue-router'
import { getLastLoadError } from '@/lib/report'
import StateBlock from '@/components/StateBlock.vue'
import { Button } from '@/components/ui/button'

defineProps({
	title: {
		type: String,
		default: '課程資料讀取失敗'
	}
})

const emit = defineEmits(['retry'])

const route = useRoute()
const router = useRouter()

function reportProblem() {
	router.push({ name: 'contact', query: { from: route.fullPath, ...getLastLoadError() } })
}
</script>

<template>
	<StateBlock :icon="CloudAlert" :title="title" description="請檢查網路連線或稍後再試一次，若持續發生請回報問題" container-class="fixed inset-0 z-[100] bg-color-2 px-6">
		<template #extra>
			<div class="mt-2 flex items-center gap-2">
				<Button variant="outline" @click="emit('retry')">重試</Button>
				<Button variant="ghost" class="text-color-6" @click="reportProblem">回報問題</Button>
			</div>
		</template>
	</StateBlock>
</template>
