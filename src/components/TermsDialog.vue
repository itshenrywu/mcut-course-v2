<script setup>
import { ref } from 'vue'
import SourceDisclaimer from '@/components/SourceDisclaimer.vue'
import TextLink from '@/components/TextLink.vue'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'

const emit = defineEmits(['agree'])

const open = ref(true)

function onAgree() {
	localStorage.setItem('mcv2-terms-agreed', '1')
	open.value = false
	emit('agree')
}
</script>

<template>
	<Dialog v-model:open="open">
		<DialogContent
			class="max-w-2xl"
			:show-close-button="false"
			@escape-key-down.prevent
			@pointer-down-outside.prevent
			@focus-outside.prevent
			@interact-outside.prevent
		>
			<DialogHeader>
				<DialogTitle>關於本站 & 免責聲明</DialogTitle>
			</DialogHeader>
			<div class="max-h-[60dvh] overflow-y-auto overscroll-contain">
				<p class="mb-6 text-sm leading-relaxed text-color-8">
					明志科技大學選課小幫手由 107 級工業工程與管理系畢業校友
					<TextLink href="https://henrywu.tw">Henry Wu</TextLink>
					開發製作，非學校官方系統。若對本網站有任何疑慮，請避免使用。
				</p>
				<SourceDisclaimer />
			</div>
			<DialogFooter class="justify-center">
				<Button @click="onAgree()">我同意，繼續使用</Button>
			</DialogFooter>
		</DialogContent>
	</Dialog>
</template>
