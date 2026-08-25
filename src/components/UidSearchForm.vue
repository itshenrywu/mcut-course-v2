<script setup>
import { LoaderCircle, Search } from '@lucide/vue'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

defineProps({
	inputId: {
		type: String,
		default: 'uid'
	},
	loading: {
		type: Boolean,
		default: false
	},
	formatError: {
		type: Boolean,
		default: false
	}
})

const emit = defineEmits(['search'])

const uid = defineModel({ type: String, default: '' })
</script>

<template>
	<section class="flex flex-col gap-1.5">
		<form class="flex items-end gap-4" @submit.prevent="emit('search')">
			<div class="flex flex-1 flex-col gap-1.5">
				<label :for="inputId" class="text-sm font-medium">學號</label>
				<Input
					:id="inputId"
					v-model="uid"
					class="bg-color-1"
					maxlength="9"
					autocomplete="off"
					autocapitalize="characters"
					spellcheck="false"
				/>
			</div>
			<Button type="submit" :disabled="loading">
				<LoaderCircle v-if="loading" class="animate-spin" />
				<Search v-else />
				查詢
			</Button>
		</form>
		<p v-if="formatError" class="px-1 text-xs text-color-6">請輸入正確的學號</p>
	</section>
</template>
