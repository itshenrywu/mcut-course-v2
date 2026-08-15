<script setup>
import { computed } from 'vue'
import { Copy } from '@lucide/vue'
import { toast } from '@/components/ui/sonner'
import { Button } from '@/components/ui/button'
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import ColorPicker from '@/components/ColorPicker.vue'
import { useWidgetColor, buildWidgetCode, widgetColors, WIDGET_COLOR_ROWS, SCRIPTABLE_URL } from '@/lib/my-course-widget'

// 關掉漸層時, 色塊改用斜線表示 "無"
const NONE_SWATCH = 'linear-gradient(to top right, transparent calc(50% - 1px), var(--color-color-6) calc(50% - 1px) calc(50% + 1px), transparent calc(50% + 1px))'

const open = defineModel('open', { type: Boolean, default: false })

const props = defineProps({
	courses: {
		type: Array,
		default: () => []
	}
})

const { widget_color } = useWidgetColor()

const preview_style = computed(() => {
	const [start, end] = widgetColors(widget_color.value)
	return {
		background: `linear-gradient(${start}, ${end})`,
		color: widget_color.value.text_color
	}
})

const code = computed(() => open.value ? buildWidgetCode(props.courses, widget_color.value) : '')

// 漸層關掉時, 色塊與選色器都退回背景色, 選了顏色就自動開啟漸層
function isNone(field) {
	return Boolean(field.gradient) && !widget_color.value.gradient
}

function fieldColor(field) {
	return isNone(field) ? widget_color.value.bg_color : widget_color.value[field.key]
}

function setFieldColor(field, value) {
	widget_color.value[field.key] = value
	if (field.gradient) widget_color.value.gradient = true
}

async function copyCode() {
	try {
		await navigator.clipboard.writeText(code.value)
		toast.success('已複製程式碼')
	} catch {
		toast.error('程式碼複製失敗，請手動選取複製')
	}
}
</script>

<template>
	<Dialog v-model:open="open">
		<DialogContent class="max-w-md">
			<DialogHeader>
				<DialogTitle>安裝 iOS 小工具</DialogTitle>
			</DialogHeader>

			<div class="-mx-2 flex max-h-[70dvh] flex-col gap-3 overflow-y-auto overscroll-contain px-2 text-sm">
				<p class="text-color-6 text-xs">在桌面或鎖定畫面就能看到下一堂課</p>

				<ol class="text-color-8 flex list-outside list-decimal flex-col gap-4 pl-5 leading-relaxed">
					<li>
						安裝
						<a :href="SCRIPTABLE_URL" target="_blank" rel="noreferrer" class="underline underline-offset-2">Scriptable</a>
						（App Store 免費）
					</li>

					<li>
						挑選喜歡的顏色
						<div class="mt-2 flex items-center gap-3">
							<div class="flex aspect-square w-28 shrink-0 flex-col justify-center rounded-xl px-3" :style="preview_style">
								<span class="text-[0.7rem] opacity-90">下一堂課</span>
								<span class="mt-1 text-sm font-bold">課程名稱</span>
								<span class="text-xs">13:00 ~ 15:50</span>
							</div>
							<div class="flex min-w-0 flex-1 flex-col gap-2">
								<div v-for="(row, index) in WIDGET_COLOR_ROWS" :key="index" class="flex min-w-0 gap-2">
									<Popover v-for="field in row" :key="field.key">
										<PopoverTrigger
											class="border-color-3 bg-color-1 focus-visible:border-color-5 focus-visible:ring-color-5/50 flex h-9 min-w-0 flex-1 items-center gap-2 rounded-md border px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-[3px]"
											:aria-label="`${field.label}顏色`"
										>
											<span
												class="border-color-4 size-4 shrink-0 rounded-full border"
												:style="{ background: isNone(field) ? NONE_SWATCH : widget_color[field.key] }"
											></span>
											<span class="truncate">{{ isNone(field) ? '無漸層' : field.label }}</span>
										</PopoverTrigger>
										<PopoverContent align="start" class="flex w-64 flex-col gap-3 p-3">
											<Button
												v-if="field.gradient"
												:variant="isNone(field) ? 'default' : 'outline'"
												size="sm"
												@click="widget_color.gradient = false"
											>
												無
											</Button>
											<ColorPicker :model-value="fieldColor(field)" @update:model-value="setFieldColor(field, $event)" />
										</PopoverContent>
									</Popover>
								</div>
							</div>
						</div>
					</li>

					<li>
						複製下面的程式碼
						<div class="mt-2 flex flex-col gap-2">
							<pre class="border-color-3 bg-color-2 text-color-7 max-h-32 overflow-auto overscroll-contain rounded-md border p-2 font-mono text-[0.7rem] leading-relaxed">{{ code }}</pre>
							<Button variant="outline" size="sm" class="self-start" @click="copyCode()">
								<Copy />
								複製程式碼
							</Button>
						</div>
					</li>

					<li>開啟 Scriptable，按右上角的 <b class="font-medium text-sky-500">+</b>，貼上程式碼後按 <b class="font-medium text-sky-500">Done</b></li>

					<li>回到桌面或鎖定畫面，長按空白處新增小工具，選擇 <b class="font-medium">Scriptable</b></li>

					<li>長按小工具 &gt; 編輯小工具，把 <b class="font-medium">Script</b> 設成剛剛新增的檔案</li>
				</ol>

				<p class="text-color-6 text-xs">課表或顏色改過之後，要回到這裡重新複製一次程式碼，小工具才會跟著更新</p>
			</div>
		</DialogContent>
	</Dialog>
</template>
