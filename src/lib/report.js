export function attachLoadError(error, method, url, status, message = '') {
	error.load_error = { method, url, status, message, time: Date.now(), online: navigator.onLine }
	return error
}

export function loadErrorInfo(error) {
	return error?.load_error || { message: error?.message || '', time: Date.now(), online: navigator.onLine }
}
