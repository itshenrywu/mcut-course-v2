<script setup>
import { ref } from 'vue'
import { Link, TriangleAlert } from '@lucide/vue'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Drawer, DrawerContent } from '@/components/ui/drawer'
import { DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { toast } from '@/components/ui/sonner'
import { useInAppBrowserHint, dismissInAppBrowserHint } from '@/lib/in-app-browser'

const { hint_open } = useInAppBrowserHint()

const dont_remind = ref(false)

function onOpenChange(open) {
	if (!open && dont_remind.value) dismissInAppBrowserHint()
	hint_open.value = open
}

async function copyLink() {
	try {
		await navigator.clipboard.writeText(location.href)
		toast.success('連結已複製', { description: '貼到瀏覽器網址列即可開啟' })
	} catch (error) {
		console.error(error)
		toast.error('複製失敗，請手動複製網址')
	}
}
</script>

<template>
	<Drawer :open="hint_open" @update:open="onOpenChange">
		<DrawerContent :show-close-button="false">
			<DialogHeader class="pr-2 text-left">
				<DialogTitle class="flex items-center gap-2">
					<TriangleAlert class="size-5 shrink-0 text-amber-500" />
					建議用外部瀏覽器開啟
				</DialogTitle>
				<DialogDescription>
					你正在 App 內建瀏覽器中使用本網站。收藏與我的課表存在這個瀏覽器裡，離開 App 後可能會遺失，下載課表圖片也可能失敗，也可能無法正常登入後同步資料。
				</DialogDescription>
			</DialogHeader>
			<p class="text-color-8 bg-color-2 rounded-md p-3 text-sm leading-relaxed">
				請點 <span class="font-medium">⋯</span> 或分享按鈕，選擇「以預設瀏覽器開啟」，用一般瀏覽器繼續操作。
			</p>
			<Checkbox v-model="dont_remind" class="text-color-6">不再提醒</Checkbox>
			<DialogFooter class="mt-1 gap-4">
				<Button variant="secondary" class="flex-1" @click="copyLink()">
					<Link />
					複製連結
				</Button>
				<Button class="flex-1" @click="onOpenChange(false)">我知道了</Button>
			</DialogFooter>
		</DrawerContent>
	</Drawer>
</template>
