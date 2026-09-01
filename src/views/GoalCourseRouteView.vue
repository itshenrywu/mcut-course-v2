<script setup>
import { computed, ref, onMounted, watch } from 'vue'
import { Clock, ExternalLink, SearchX } from '@lucide/vue'
import { useRouteInfo, routeRowList, routeOptions, routeSignupUrl } from '@/lib/route'
import { useUidSearch } from '@/lib/uid'
import { useLocalRef } from '@/lib/storage'
import LoadError from '@/components/LoadError.vue'
import LoadingOverlay from '@/components/LoadingOverlay.vue'
import PageContainer from '@/components/PageContainer.vue'
import StateBlock from '@/components/StateBlock.vue'
import SectionCard from '@/components/SectionCard.vue'
import HintList from '@/components/HintList.vue'
import DefinitionList from '@/components/DefinitionList.vue'
import DefinitionRow from '@/components/DefinitionRow.vue'
import SelectFilterField from '@/components/SelectFilterField.vue'
import UidSearchForm from '@/components/UidSearchForm.vue'
import { Button } from '@/components/ui/button'
import SponsorAd from '@/components/SponsorAd.vue'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

const {
	route_item,
	route_list,
	route_mode,
	route_description_list,
	route_locked_description,
	info_loaded,
	info_error,
	searched_uid,
	loading,
	load_error,
	list_error,
	loadRoute,
	loadRouteInfo,
	loadRouteList,
	markRouteSeen
} = useRouteInfo()

const { uid_input, format_error, search, retry } = useUidSearch({
	searched_uid,
	load: loadRoute
})

const selected_tab = ref('')

const current_tab = computed({
	get: () => selected_tab.value || (route_mode.value === 'route' ? 'all' : 'my'),
	set: value => {
		selected_tab.value = value
	}
})

const selected_route_id = useLocalRef('mcv2-route-select')

const option_list = computed(() => routeOptions(route_list.value))

const selected_route = computed(() => route_list.value.find(route => String(route.route_id) === selected_route_id.value) || null)

const current_item = computed(() => current_tab.value === 'my' ? route_item.value : selected_route.value)

const row_list = computed(() => routeRowList(current_item.value))

const signup_url = computed(() => routeSignupUrl(current_item.value, route_mode.value))

const show_locked = computed(() => current_tab.value === 'my' && route_mode.value === 'route')

const show_not_found = computed(() => current_tab.value === 'my' && route_mode.value === 'uid' && Boolean(searched_uid.value) && !route_item.value)

onMounted(() => {
	markRouteSeen()
	loadRouteInfo()
	loadRouteList()
})

watch(option_list, () => {
	if (!option_list.value.length) return
	if (!option_list.value.some(option => option.value === selected_route_id.value)) {
		selected_route_id.value = option_list.value[0].value
	}
}, { immediate: true })
</script>

<template>
	<LoadError v-if="info_error" title="路線資料讀取失敗" @retry="loadRouteInfo({ force: true })" />
	<LoadError v-else-if="load_error" title="路線資料讀取失敗" @retry="retry()" />
	<LoadError v-else-if="list_error" title="路線資料讀取失敗" @retry="loadRouteList({ force: true })" />
	<LoadingOverlay v-else-if="!info_loaded" text="路線資料讀取中…" />

	<PageContainer v-if="info_loaded" title="大學之道「環境與行動」路線查詢" container-class="gap-6">
		<SectionCard v-if="route_description_list.length" title="說明" card-class="p-4">
			<HintList class="list-none pl-0">
				<li v-for="line in route_description_list" :key="line">{{ line }}</li>
			</HintList>
		</SectionCard>

		<Tabs v-model="current_tab">
			<TabsList class="w-full border border-color-3 bg-color-1" aria-label="查詢方式">
				<TabsTrigger value="my">我的路線</TabsTrigger>
				<TabsTrigger value="all">所有路線</TabsTrigger>
			</TabsList>
		</Tabs>

		<UidSearchForm
			v-if="current_tab === 'my' && !show_locked"
			v-model="uid_input"
			input-id="route-uid"
			:loading="loading"
			:format-error="format_error"
			@search="search()"
		/>

		<SelectFilterField
			v-if="current_tab === 'all' && option_list.length"
			v-model="selected_route_id"
			label="選擇路線"
			:options="option_list"
		/>

		<StateBlock
			v-if="show_locked"
			:icon="Clock"
			title="尚未開放查詢"
			:description="route_locked_description"
			container-class="flex-1"
		/>
		<StateBlock
			v-else-if="show_not_found"
			:icon="SearchX"
			:title="`查無 ${searched_uid} 的路線資料`"
			description="請確認學號是否正確"
			container-class="flex-1"
		/>

		<section v-if="row_list.length" class="flex flex-col gap-3">
			<DefinitionList>
				<DefinitionRow
					v-for="row in row_list"
					:key="row.label"
					:label="row.label"
					:dd-class="row.dd_class || 'whitespace-pre-line'"
				>
					<span v-if="row.value">{{ row.value }}</span>
					<span v-else class="text-color-4">—</span>
				</DefinitionRow>
			</DefinitionList>

			<Button v-if="signup_url" as="a" :href="signup_url" target="_blank" rel="noopener noreferrer" class="w-full">
				前往報名
				<ExternalLink />
			</Button>
		</section>

		<SponsorAd v-if="row_list.length" />
	</PageContainer>
</template>
