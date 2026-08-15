import { computed, onMounted } from 'vue'
import { getInfo } from '@/api/info'
import { createLoader } from '@/lib/loader'

export const CHANGE_TYPE_CLASSES = {
	'feat': 'bg-sky-400/10 text-sky-600 inset-ring inset-ring-sky-400/10',
	'fix': 'bg-rose-400/10 text-rose-600 inset-ring inset-ring-rose-400/10',
	'refactor': 'bg-amber-400/10 text-amber-600 inset-ring inset-ring-amber-400/10'
}

export const CHANGE_TYPES = {
	'feat': '功能改善',
	'fix': 'Bug 修正',
	'refactor': '重構',
}

function groupChangelogByYear(list) {
	const groups = []
	for (const [index, item] of list.entries()) {
		const date = (item.date || '').trim()
		const description = (item.description || '').trim()
		if (!description || !date) continue
		const entry = {
			key: `${date}-${index}`,
			date: date.slice(5, 10).split('-').map(v => parseInt(v)).join('/'), // remove leading zeros
			type: item.type || '',
			tag: Array.isArray(item.tag) ? item.tag : [],
			description
		}
		const year = date.slice(0, 4)
		const last = groups[groups.length - 1]
		if (last && last.year === year) last.items.push(entry)
		else groups.push({ year, items: [entry] })
	}
	return groups
}

export function useChangelog() {
	const { data: change_list, loading, load_error, load: loadChangelog } = createLoader(
		async options => {
			const data = await getInfo('changelog', { ...options, label: '更新紀錄' })
			return Array.isArray(data) ? data : []
		},
		() => []
	)

	const year_groups = computed(() => groupChangelogByYear(change_list.value))

	onMounted(() => loadChangelog())

	return { change_list, year_groups, loading, load_error, loadChangelog }
}
