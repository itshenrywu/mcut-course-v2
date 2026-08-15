import { useColorMode } from '@vueuse/core'

const THEME_MODES = ['auto', 'light', 'dark']

const mode = useColorMode({
	selector: 'html',
	attribute: 'class',
	storageKey: 'mcv2-theme',
	emitAuto: true
})

function cycleTheme() {
	const index = THEME_MODES.indexOf(mode.value)
	mode.value = THEME_MODES[(index + 1) % THEME_MODES.length]
}

export function useTheme() {
	return { mode, cycleTheme, THEME_MODES }
}
