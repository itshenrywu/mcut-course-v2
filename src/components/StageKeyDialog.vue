<script setup>
import { ref } from 'vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { unlockStage } from '@/lib/stage-key'

const open = ref(true)
const stage_key = ref('')
const error_text = ref('')
const checking = ref(false)

async function onSubmit() {
	if (!stage_key.value || checking.value) return
	checking.value = true
	error_text.value = ''
	try {
		if (await unlockStage(stage_key.value)) location.reload()
		else error_text.value = '密碼錯誤'
	} catch (error) {
		error_text.value = error.message
	} finally {
		checking.value = false
	}
}
</script>

<template>
	<Dialog v-model:open="open">
		<DialogContent
			class="max-w-sm"
			:show-close-button="false"
			@escape-key-down.prevent
			@pointer-down-outside.prevent
			@focus-outside.prevent
			@interact-outside.prevent
		>
			<DialogHeader>
				<DialogTitle>此為測試版</DialogTitle>
				<DialogDescription>非測試人員請改用<a href="https://mcut-course.com" target="_blank" class="text-color-10 underline">正式版</a>，或輸入測試密碼。</DialogDescription>
			</DialogHeader>
			<form class="flex flex-col gap-2" @submit.prevent="onSubmit()">
				<Input v-model="stage_key" type="password" autofocus placeholder="測試站密碼" />
				<p v-if="error_text" class="text-xs text-destructive">{{ error_text }}</p>
				<DialogFooter class="mt-2">
					<Button type="submit" :disabled="!stage_key || checking">{{ checking ? '驗證中…' : '解鎖' }}</Button>
				</DialogFooter>
			</form>
		</DialogContent>
	</Dialog>
</template>
