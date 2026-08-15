import { spaceText } from '@/lib/utils'

const MARKER_RULES = [
	{ rank: 0, pattern: /^([一二三四五六七八九十]{1,2}[、.．])\s*/ },
	{ rank: 0, pattern: /^([IVX]{1,4}[.、])\s+/ },
	{ rank: 1, pattern: /^([（(][一二三四五六七八九十]{1,2}[）)])\s*/ },
	{ rank: 2, pattern: /^(\d{1,2}[.、．])\s*/ },
	{ rank: 3, pattern: /^([（(]\d{1,2}[）)])\s*/ },
	{ rank: 4, pattern: /^[*※•·]\s*/, marker: '•' }
]

function splitRows(text) {
	return (text || '')
		.replace(/<br\s*\/?>/gi, '\n')
		.split('\n')
		.map(row => row.trim())
}

function matchMarker(row) {
	for (const rule of MARKER_RULES) {
		const match = row.match(rule.pattern)
		if (!match) continue
		return { rank: rule.rank, marker: rule.marker || match[1], text: row.slice(match[0].length) }
	}
	return null
}

function toSegments(text) {
	return spaceText(text)
		.split( /(外系)/)
		.filter(part => part)
		.map(part => ({ text: part, highlight: part === '外系' }))
}

export function parseRemark(text) {
	const items = []
	const ranks = []
	let gap = false
	for (const row of splitRows(text)) {
		if (!row) {
			if (items.length) gap = true
			ranks.length = 0
			continue
		}
		const marker = matchMarker(row)
		if (marker) {
			while (ranks.length && ranks[ranks.length - 1] > marker.rank) ranks.pop()
			if (ranks[ranks.length - 1] !== marker.rank) ranks.push(marker.rank)
		}
		items.push({
			marker: marker ? marker.marker : '',
			depth: marker ? ranks.length - 1 : 0,
			gap,
			segments: toSegments(marker ? marker.text : row)
		})
		gap = false
	}
	return items
}
