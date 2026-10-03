<script setup>
import { ref, shallowRef, computed } from 'vue'
import { Copy, Check } from '@lucide/vue'
import PageContainer from '@/components/PageContainer.vue'
import SectionCard from '@/components/SectionCard.vue'
import ConfirmDialog from '@/components/ConfirmDialog.vue'
import EmptyHint from '@/components/EmptyHint.vue'
import InlineLoading from '@/components/InlineLoading.vue'
import TextLink from '@/components/TextLink.vue'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import StorageRow from '@/debug/StorageRow.vue'
import {
	formatBytes,
	isSecretKey,
	readStorageEntries,
	removeStorageEntry,
	readCookies,
	removeCookie,
	listDatabases,
	readDatabase,
	removeDatabaseEntry,
	clearDatabaseStore,
	deleteDatabase,
	listCaches,
	removeCache,
	listWorkers,
	unregisterWorker,
	clearAll,
	notifyOtherTabs,
	buildDiagnostics
} from '@/debug/device-storage'

const local_entries = ref([])
const session_entries = ref([])
const cookies = ref([])
const databases = shallowRef([])
const cache_names = ref([])
const workers = shallowRef([])
const loaded = ref(false)
const revealed_keys = ref([])

const clearing = ref(false)
const cleared = ref(false)
const blocked_names = ref([])

const confirm_open = ref(false)
const confirm_action = ref({ title: '', description: '', confirm_text: '', run: null })

const diagnostics_open = ref(false)
const diagnostics_text = ref('')
const diagnostics_pre = ref(null)
const copy_state = ref('')

const has_other = computed(() => Boolean(session_entries.value.length || cookies.value.length || cache_names.value.length || workers.value.length))

function sumSize(entries) {
	return entries.reduce((sum, entry) => sum + entry.size, 0)
}

function formatValue(value) {
	try {
		const parsed = JSON.parse(value)
		if (parsed && typeof parsed === 'object') return JSON.stringify(parsed, null, 2)
	} catch {}
	return value
}

async function refresh() {
	local_entries.value = readStorageEntries('localStorage')
	session_entries.value = readStorageEntries('sessionStorage')
	cookies.value = readCookies()
	const [database_list, next_cache_names, next_workers] = await Promise.all([listDatabases(), listCaches(), listWorkers()])
	databases.value = (await Promise.all(database_list.map(db => readDatabase(db.name)))).filter(Boolean)
	cache_names.value = next_cache_names
	workers.value = next_workers
	loaded.value = true
}

function askConfirm(title, description, confirm_text, run) {
	confirm_action.value = { title, description, confirm_text, run }
	confirm_open.value = true
}

function confirmRemove(title, run, confirm_text = '刪除') {
	askConfirm(title, '刪除後無法復原，其他開著本站的分頁會自動重新整理。', confirm_text, run)
}

function confirmDeleteDatabase(name) {
	confirmRemove(`刪除資料庫 ${name}？`, async () => {
		const result = await deleteDatabase(name)
		blocked_names.value = result === 'blocked' ? [...blocked_names.value, name] : blocked_names.value.filter(item => item !== name)
	})
}

function confirmClearAll() {
	askConfirm('清除所有資料？', '收藏、課表與設定都會從這台裝置刪除，未登入時建立的資料無法復原。', '清除', async () => {
		clearing.value = true
		try {
			blocked_names.value = await clearAll()
			cleared.value = true
		} finally {
			clearing.value = false
		}
	})
}

async function runConfirm() {
	try {
		await confirm_action.value.run()
	} catch (error) {
		console.error(error)
	}
	notifyOtherTabs()
	await refresh()
}

async function openDiagnostics() {
	diagnostics_text.value = ''
	copy_state.value = ''
	diagnostics_open.value = true
	diagnostics_text.value = await buildDiagnostics()
}

async function copyDiagnostics() {
	try {
		await navigator.clipboard.writeText(diagnostics_text.value)
		copy_state.value = 'copied'
		return
	} catch {}
	getSelection().selectAllChildren(diagnostics_pre.value)
	copy_state.value = document.execCommand('copy') ? 'copied' : 'failed'
}

window.addEventListener('storage', () => {
	local_entries.value = readStorageEntries('localStorage')
})
refresh()
</script>

<template>
	<PageContainer title="裝置資料">
		<SectionCard card-class="flex flex-col gap-3 p-4">
			<template v-if="cleared">
				<p class="text-sm">已清除這台裝置上的資料，其他開著本站的分頁會自動重新整理。</p>
				<p v-if="blocked_names.length" class="text-xs text-color-6">資料庫 {{ blocked_names.join('、') }} 還有分頁在使用，關掉那些分頁後才會刪除。</p>
			</template>
			<template v-else>
				<p class="text-sm">網站顯示不正常時，可以清除這台裝置上儲存的資料，再回首頁重新載入。</p>
				<p class="text-xs text-color-6">未登入時建立的收藏與課表也會一起刪除，無法復原。</p>
			</template>
			<div class="flex flex-wrap justify-end gap-2">
				<Button variant="outline" @click="openDiagnostics()">診斷資訊</Button>
				<Button v-if="cleared" as="a" href="/">回首頁</Button>
				<template v-else>
					<Button variant="outline" as="a" href="/">回首頁</Button>
					<Button variant="destructive" :disabled="clearing" @click="confirmClearAll()">{{ clearing ? '清除中…' : '全部清除' }}</Button>
				</template>
			</div>
		</SectionCard>

		<InlineLoading v-if="!loaded" container-class="py-8" />
		<template v-else>
			<SectionCard :title="`localStorage・${local_entries.length} 筆・${formatBytes(sumSize(local_entries))}`" card-class="flex flex-col divide-y overflow-hidden">
				<StorageRow
					v-for="entry in local_entries"
					:key="entry.key"
					:label="entry.key"
					:meta="formatBytes(entry.size)"
					expandable
					@remove="confirmRemove(`刪除 ${entry.key}？`, () => removeStorageEntry('localStorage', entry.key))"
				>
					<div v-if="isSecretKey(entry.key) && !revealed_keys.includes(entry.key)" class="flex items-center gap-3">
						<span class="font-mono text-xs text-color-6">••••••••</span>
						<Button variant="outline" size="xs" @click="revealed_keys.push(entry.key)">顯示</Button>
					</div>
					<pre v-else class="max-h-80 overflow-auto overscroll-contain rounded-md bg-color-2 p-3 font-mono text-xs break-all whitespace-pre-wrap">{{ formatValue(entry.value) }}</pre>
				</StorageRow>
				<EmptyHint v-if="!local_entries.length">沒有資料</EmptyHint>
			</SectionCard>

			<SectionCard v-for="db in databases" :key="db.name" :title="`IndexedDB・${db.name}${db.version ? `・v${db.version}` : ''}`" card-class="flex flex-col divide-y overflow-hidden">
				<template v-for="store in db.stores" :key="store.name">
					<div class="flex min-h-9 items-center gap-2 bg-color-2/50 py-1 pr-2 pl-4">
						<p class="min-w-0 flex-1 truncate text-xs text-color-6">
							<span class="font-mono">{{ store.name }}</span>・<span class="font-num tabular-nums">{{ store.entries.length }} 筆・{{ formatBytes(store.size) }}</span>
						</p>
						<Button v-if="store.entries.length" variant="destructive-ghost" size="xs" @click="confirmRemove(`清空 ${store.name}？`, () => clearDatabaseStore(db.name, store.name), '清空')">清空</Button>
					</div>
					<StorageRow
						v-for="entry in store.entries"
						:key="entry.key_text"
						:label="entry.key_text"
						:meta="formatBytes(entry.size)"
						@remove="confirmRemove(`刪除 ${entry.key_text}？`, () => removeDatabaseEntry(db.name, store.name, entry.key))"
					/>
				</template>
				<p v-if="db.error" class="px-4 py-2.5 text-xs text-destructive">{{ db.error }}</p>
				<p v-if="blocked_names.includes(db.name)" class="px-4 py-2.5 text-xs text-color-6">還有其他分頁開著本站，關掉那些分頁後才會刪除。</p>
				<div class="flex justify-end px-2 py-1">
					<Button variant="destructive-ghost" size="xs" @click="confirmDeleteDatabase(db.name)">刪除整個資料庫</Button>
				</div>
			</SectionCard>

			<template v-if="has_other">
				<SectionCard v-if="session_entries.length" :title="`sessionStorage・${session_entries.length} 筆`" card-class="flex flex-col divide-y overflow-hidden">
					<StorageRow
						v-for="entry in session_entries"
						:key="entry.key"
						:label="entry.key"
						:meta="formatBytes(entry.size)"
						expandable
						@remove="confirmRemove(`刪除 ${entry.key}？`, () => removeStorageEntry('sessionStorage', entry.key))"
					>
						<pre class="max-h-80 overflow-auto overscroll-contain rounded-md bg-color-2 p-3 font-mono text-xs break-all whitespace-pre-wrap">{{ formatValue(entry.value) }}</pre>
					</StorageRow>
				</SectionCard>

				<SectionCard v-if="cookies.length" :title="`Cookie・${cookies.length} 筆`" card-class="flex flex-col divide-y overflow-hidden">
					<StorageRow
						v-for="cookie in cookies"
						:key="cookie.key"
						:label="cookie.key"
						:meta="formatBytes(cookie.size)"
						expandable
						@remove="confirmRemove(`刪除 ${cookie.key}？`, () => removeCookie(cookie.key))"
					>
						<pre class="max-h-80 overflow-auto overscroll-contain rounded-md bg-color-2 p-3 font-mono text-xs break-all whitespace-pre-wrap">{{ cookie.value }}</pre>
					</StorageRow>
				</SectionCard>

				<SectionCard v-if="cache_names.length" title="Cache Storage" card-class="flex flex-col divide-y overflow-hidden">
					<StorageRow
						v-for="name in cache_names"
						:key="name"
						:label="name"
						@remove="confirmRemove(`刪除 ${name}？`, () => removeCache(name))"
					/>
				</SectionCard>

				<SectionCard v-if="workers.length" title="Service Worker" card-class="flex flex-col divide-y overflow-hidden">
					<StorageRow
						v-for="registration in workers"
						:key="registration.scope"
						:label="registration.scope"
						@remove="confirmRemove(`移除 ${registration.scope}？`, () => unregisterWorker(registration), '移除')"
					/>
				</SectionCard>
			</template>
		</template>

		<ConfirmDialog
			v-model:open="confirm_open"
			:title="confirm_action.title"
			:description="confirm_action.description"
			:confirm-text="confirm_action.confirm_text"
			confirm-variant="destructive"
			@confirm="runConfirm()"
		/>

		<Dialog v-model:open="diagnostics_open">
			<DialogContent>
				<DialogHeader>
					<DialogTitle>診斷資訊</DialogTitle>
					<DialogDescription><TextLink href="/contact">回報問題</TextLink>時附上這段文字，登入憑證、學號與帳號資料已經隱藏。</DialogDescription>
				</DialogHeader>
				<pre v-if="diagnostics_text" ref="diagnostics_pre" class="max-h-[50dvh] overflow-auto overscroll-contain rounded-md bg-color-2 p-3 font-mono text-xs break-all whitespace-pre-wrap">{{ diagnostics_text }}</pre>
				<InlineLoading v-else container-class="py-8" />
				<p v-if="copy_state === 'failed'" class="text-xs text-destructive">無法自動複製，文字已經選取，請手動複製。</p>
				<DialogFooter>
					<Button class="flex-1" :disabled="!diagnostics_text" @click="copyDiagnostics()">
						<Check v-if="copy_state === 'copied'" />
						<Copy v-else />
						{{ copy_state === 'copied' ? '已複製' : '複製' }}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	</PageContainer>
</template>
