let last_path = ''

export function sendPageView(path) {
	if (typeof gtag !== 'function') return
	if (path === last_path) return
	last_path = path
	gtag('event', 'page_view', {
		page_path: path,
		page_title: document.title,
		page_location: window.location.href
	})
}