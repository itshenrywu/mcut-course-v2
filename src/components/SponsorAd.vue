<script setup>
import { ref, computed, onMounted, onUnmounted, useTemplateRef } from 'vue'
import { cn } from '@/lib/utils'
import SectionCard from '@/components/SectionCard.vue'

const AD_CLIENT = 'ca-pub-5900703871265800'
// 一般寬度用 in-article (fluid)
const AD_SLOT = '3164180037'
// 可用寬度不足 250px 時 fluid 會報錯, 改用多媒體廣告
const AD_SLOT_NARROW = '8301598166'

// 第一次確認廣告狀態要等多久 (ms)
const AD_CHECK_DELAY = 1500
// 之後每隔多久再確認一次 (ms)
const AD_RETRY_DELAY = 1500
// 腳本還在載時最多再確認幾次, 免得把慢的網路當成擋廣告
const AD_PENDING_RETRY = 3

const IS_DEV = import.meta.env.DEV

const props = defineProps({
	narrow: {
		type: Boolean,
		default: false
	},
	keepSpace: {
		type: Boolean,
		default: false
	},
	title: {
		type: String,
		default: '贊助商'
	},
	sectionClass: {
		type: String,
		default: ''
	},
	titleClass: {
		type: String,
		default: ''
	},
	cardClass: {
		type: String,
		default: ''
	}
})

const ad_state = ref('loading')

const ad_attrs = computed(() => props.narrow
	? {
		'data-ad-slot': AD_SLOT_NARROW,
		'data-ad-format': 'auto',
		'data-full-width-responsive': 'true'
	}
	: {
		'data-ad-slot': AD_SLOT,
		'data-ad-layout': 'in-article',
		'data-ad-format': 'fluid'
	})

const ins_ref = useTemplateRef('ins')

let check_timer = 0
let observer = null
let has_retried = false
let pending_count = 0

function stopWatch() {
	if (check_timer) clearTimeout(check_timer)
	check_timer = 0
	observer?.disconnect()
	observer = null
}

function adStatus() {
	return ins_ref.value?.getAttribute('data-ad-status') || ''
}

function setStateByStatus(status) {
	if (IS_DEV) return
	ad_state.value = status === 'filled' ? 'filled' : 'unfilled'
	stopWatch()
}

function retryCheck() {
	check_timer = setTimeout(checkStatus, AD_RETRY_DELAY)
}

function checkStatus() {
	check_timer = 0
	const status = adStatus()
	if (status) {
		setStateByStatus(status)
		return
	}
	if (window.ad_script_failed) {
		ad_state.value = 'blocked'
		return
	}
	// loaded 卻一直沒狀態, 多半是擋廣告工具塞的假 adsbygoogle (push 是空的), 再給一次機會就好
	if (window.adsbygoogle?.loaded) {
		if (has_retried) {
			ad_state.value = 'blocked'
			return
		}
		has_retried = true
		retryCheck()
		return
	}
	if (pending_count >= AD_PENDING_RETRY) {
		ad_state.value = 'blocked'
		return
	}
	pending_count++
	retryCheck()
}

onMounted(() => {
	try {
		window.adsbygoogle = window.adsbygoogle || []
		window.adsbygoogle.push({})
	} catch (error) {
		console.error(error)
	}
	if (!ins_ref.value || window.ad_script_failed) {
		ad_state.value = 'blocked'
		return
	}
	observer = new MutationObserver(() => {
		const status = adStatus()
		if (status) setStateByStatus(status)
	})
	observer.observe(ins_ref.value, { attributes: true, attributeFilter: ['data-ad-status'] })
	check_timer = setTimeout(checkStatus, AD_CHECK_DELAY)
})

onUnmounted(stopWatch)
</script>

<template>
	<SectionCard
		v-if="ad_state !== 'unfilled' || keepSpace"
		:title="title"
		:section-class="cn(sectionClass, ad_state === 'unfilled' && 'max-lg:hidden invisible')"
		:title-class="titleClass"
		:card-class="cn('border-3 border-x-0 border-dashed md:border-x-3 flex min-h-24 w-auto! flex-col items-center justify-center p-4', cardClass)"
	>
		<p v-if="ad_state === 'blocked'" class="text-center text-sm leading-relaxed text-color-6">
			太無情了吧，擋廣告 😭<br>加入白名單，救救開發者 🙏
		</p>

		<ins
			ref="ins"
			:class="cn('adsbygoogle w-full max-w-full', ad_state === 'blocked' && 'h-0! min-h-0! overflow-hidden')"
			style="display:block; text-align:center"
			:data-ad-client="AD_CLIENT"
			v-bind="ad_attrs"
		></ins>
	</SectionCard>
</template>
