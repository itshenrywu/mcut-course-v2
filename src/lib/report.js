let last_load_error = null

export function recordLoadError(method, url, status, message = '') {
	last_load_error = { method, url, status, message, time: Date.now(), online: navigator.onLine }
}

export function getLastLoadError() {
	return last_load_error
}
