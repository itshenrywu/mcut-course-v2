import { useColorMode } from '@vueuse/core'

const THEME_MODES = ['auto', 'light', 'dark']

let restore_frame = 0

function suppressTransition() {
	const root = document.documentElement
	root.classList.add('theme-switching')
	cancelAnimationFrame(restore_frame)
	restore_frame = requestAnimationFrame(() => {
		restore_frame = requestAnimationFrame(() => root.classList.remove('theme-switching'))
	})
}

const mode = useColorMode({
	selector: 'html',
	attribute: 'class',
	storageKey: 'mcv2-theme',
	emitAuto: true,
	disableTransition: false,
	onChanged: (value, defaultHandler) => {
		suppressTransition()
		defaultHandler(value)
	}
})

function cycleTheme() {
	const index = THEME_MODES.indexOf(mode.value)
	mode.value = THEME_MODES[(index + 1) % THEME_MODES.length]
}

export function useTheme() {
	return { mode, cycleTheme, THEME_MODES }
}
