<script setup>
import { computed, onMounted } from 'vue'
import { SearchX } from '@lucide/vue'
import { useRouteInfo, routeRowList } from '@/lib/route'
import { useUidSearch } from '@/lib/uid'
import LoadError from '@/components/LoadError.vue'
import PageContainer from '@/components/PageContainer.vue'
import StateBlock from '@/components/StateBlock.vue'
import DefinitionList from '@/components/DefinitionList.vue'
import DefinitionRow from '@/components/DefinitionRow.vue'
import UidSearchForm from '@/components/UidSearchForm.vue'
import SponsorAd from '@/components/SponsorAd.vue'

const { route_item, searched_uid, loading, load_error, loadRoute, markRouteSeen } = useRouteInfo()

const { uid_input, format_error, search, retry } = useUidSearch({
	searched_uid,
	load: loadRoute
})

const row_list = computed(() => routeRowList(route_item.value))

const show_not_found = computed(() => Boolean(searched_uid.value) && !route_item.value)

onMounted(() => {
	markRouteSeen()
})
</script>

<template>
	<LoadError v-if="load_error" title="路線資料讀取失敗" @retry="retry()" />

	<PageContainer title="大學之道「環境與行動」路線查詢" container-class="gap-6">
		<UidSearchForm
			v-model="uid_input"
			input-id="route-uid"
			:loading="loading"
			:format-error="format_error"
			@search="search()"
		/>

		<section v-if="row_list.length" class="flex flex-col gap-3">
			<DefinitionList>
				<DefinitionRow v-for="row in row_list" :key="row.label" :label="row.label" dd-class="whitespace-pre-line">
					<span v-if="row.value">{{ row.value }}</span>
					<span v-else class="text-color-4">—</span>
				</DefinitionRow>
			</DefinitionList>
		</section>

		<StateBlock
			v-else-if="show_not_found"
			:icon="SearchX"
			:title="`查無 ${searched_uid} 的路線資料`"
			description="請確認學號是否正確"
			container-class="flex-1"
		/>

		<SponsorAd v-if="row_list.length" />
	</PageContainer>
</template>
