<script setup>
import { computed } from 'vue'
import { CloudAlert, Construction, WifiOff } from '@lucide/vue'
import { useRoute, useRouter } from 'vue-router'
import StateBlock from '@/components/StateBlock.vue'
import { Button } from '@/components/ui/button'

const props = defineProps({
	title: {
		type: String,
		default: '課程資料讀取失敗'
	},
	error: {
		type: Object,
		default: null
	},
	description: {
		type: String,
		default: ''
	},
	level: {
		type: Number,
		default: 2
	},
	inline: {
		type: Boolean,
		default: false
	}
})

const emit = defineEmits(['retry'])

const route = useRoute()
const router = useRouter()

const state = computed(() => {
	if (props.error?.online === false) return { icon: WifiOff, message: '請檢查網路連線後再試一次' }
	if (props.error?.status >= 500) return { icon: Construction, message: '伺服器錯誤，請稍後再試' }
	return { icon: CloudAlert, message: props.description || '請稍後再試一次，若持續發生請回報問題' }
})

function reportProblem() {
	router.push({ name: 'contact', query: { from: route.fullPath, ...props.error } })
}
</script>

<template>
	<StateBlock
		:icon="state.icon"
		:title="title"
		:description="state.message"
		:level="level"
		:container-class="inline ? 'px-6 py-16' : 'flex-1 px-6 py-24'"
	>
		<template #extra>
			<div class="mt-2 flex items-center gap-2">
				<Button variant="outline" @click="emit('retry')">重試</Button>
				<Button variant="ghost" class="text-color-6" @click="reportProblem">回報問題</Button>
			</div>
		</template>
	</StateBlock>
</template>
