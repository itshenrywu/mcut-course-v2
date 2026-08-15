import { onMounted } from 'vue'
import { getInfo } from '@/api/info'
import { createLoader } from '@/lib/loader'

export function splitGuideHtml(html, section_index) {
	if (!html || section_index < 1 || typeof DOMParser === 'undefined') return [html, '']
	const doc = new DOMParser().parseFromString(`<body>${html}</body>`, 'text/html')
	const nodes = [...doc.body.childNodes]
	let count = 0
	let split_at = -1
	for (let index = 0; index < nodes.length; index++) {
		if (nodes[index].nodeName !== 'H2') continue
		count++
		if (count > section_index) {
			split_at = index
			break
		}
	}
	if (split_at < 0) return [html, '']
	const before = document.createElement('div')
	const after = document.createElement('div')
	for (const node of nodes.slice(0, split_at)) before.append(node)
	for (const node of nodes.slice(split_at)) after.append(node)
	return [before.innerHTML, after.innerHTML]
}

export function useGuide() {
	const { data: guide_html, loading, load_error, load: loadGuide } = createLoader(
		options => getInfo('guide', { ...options, label: '選課指南', parse: 'text' }),
		''
	)

	onMounted(() => loadGuide())

	return { guide_html, loading, load_error, loadGuide }
}
