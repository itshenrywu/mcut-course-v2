export function isIOS() {
	if (/iP(hone|ad|od)/.test(navigator.userAgent)) return true
	return navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1
}

export function isMobile() {
	return isIOS() || /Android/.test(navigator.userAgent)
}
