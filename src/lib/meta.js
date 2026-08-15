import { ogImageUrl } from '@/config/index.js'

function upsertMeta(attr, key, content) {
	let el = document.head.querySelector(`meta[${attr}="${key}"]`)
	if (!el) {
		el = document.createElement('meta')
		el.setAttribute(attr, key)
		document.head.appendChild(el)
	}
	el.setAttribute('content', content)
}

export function setPageMeta({ title, description }) {
	document.title = title
	upsertMeta('name', 'description', description)
	upsertMeta('property', 'og:title', title)
	upsertMeta('property', 'og:description', description)
	upsertMeta('property', 'og:image', ogImageUrl(window.location.pathname, __BUILD_TIME__))
}
