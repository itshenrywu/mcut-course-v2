import { readJsonItem, writeJsonItem } from '@/lib/storage'
import { SECTION_ORDER } from '@/lib/course-format'

// 舊版 (Nuxt 2) 留在瀏覽器的 localStorage 與 IndexedDB, 對應規則見 MIGRATION.md
// 這個模組必須是 main.js 的第一個 import, 而且不能 import my-course.js / favorite.js / auth.js
// 那些模組在載入當下就讀 localStorage, 晚一步搬就來不及, 所以下面的常數只能各自維護一份

// 我的課表可選的星期與長度上限 (同 my-course.js)
const MY_WEEKDAYS = [1, 2, 3, 4, 5]
const NAME_MAX_LENGTH = 30
const REMARK_MAX_LENGTH = 50

// 舊版畫布寬度, 外距存的是像素值, 新版 margin 是佔寬度的百分比
const LEGACY_CANVAS_WIDTH = 1080

// 舊版節次範圍字串 (例如 1~3)
const LEGACY_PERIOD_PATTERN = /^(\d+(?:\.\d+)?)~(\d+(?:\.\d+)?)$/

// 舊版的純色背景, 對齊新版 MY_BG_COLORS 才能在色盤上選中
const LIGHT_BG_COLOR = '#f9fbfb'
const DARK_BG_COLOR = '#161b1d'

// 舊版衝堂課程 1 顯示 / 2 置底 / 0 隱藏
const CONFLICT_MODE_MAP = { 1: 'show', 2: 'bottom', 0: 'hide' }

// 舊版 year_term 與新版 term 都是「上 → 下學期, 再依年級」, 名稱剛好相反不能直接搬
const SORT_MODE_MAP = { year_term: 'term', term: 'grade' }

// 搬完就從舊 key 移除, 前綴類的另外掃 (課程快取 / 已關閉的公告 / 已看過的說明)
const LEGACY_KEYS = [
	'auth_key', 'uid', 'profile_name', 'profile_image', 'last_path',
	'searchQuery', 'dept', 'class', 'type', 'showConflict', 'displayType', 'term',
	'savedCourse', 'savedCourseSync', 'myCourses', 'myCoursesSetting', 'myCourseSync',
	'announcement_data', 'ruleYear', 'ruleDept', 'ruleRule', 'ruleTerm', 'term_sort',
	'theme', 'acceptTerms', 'clickRemoveAd', 'calendar_view', 'calendar_type'
]
const LEGACY_PREFIXES = ['courseData_', 'courseDataTime_', 'announcement_closed_', 'clickInfo_']

// 刪掉之前先整包留一份原始值當備援, 遷移轉爛了還救得回來
// 課程快取與頭像 base64 體積大又能重抓, 進了備份只會多佔一倍空間, 不留
const BACKUP_SKIP_KEYS = ['profile_image']
const BACKUP_SKIP_PREFIXES = ['courseData_', 'courseDataTime_']

// 舊版背景圖放在另一個 db, 搬完才刪, 搬到一半關掉頁面下次還要再試
const LEGACY_DB_NAME = 'mcut-course'
const LEGACY_DB_STORE = 'settings'
const LEGACY_BG_IMAGE_KEY = 'backgroundImage'

function writeString(key, value) {
	if (localStorage.getItem(key) === null) localStorage.setItem(key, value)
}

function writeJson(key, value) {
	if (localStorage.getItem(key) === null) writeJsonItem(key, value)
}

function moveString(from_key, to_key) {
	const value = localStorage.getItem(from_key)
	if (value) writeString(to_key, value)
}

function toNumber(value) {
	const number = Number(value)
	return Number.isFinite(number) ? number : undefined
}

function isPlainObject(value) {
	return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function createId() {
	return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

function migrateFavorite() {
	const saved = readJsonItem('savedCourse', null, Array.isArray)
	if (!saved) return
	writeJson('mcv2-favorites', saved.filter(id => typeof id === 'string' && id))
}

function toMyCourse(item) {
	if (!isPlainObject(item)) return null
	const time = Array.isArray(item.time) ? item.time : []
	const period = String(time[1] ?? '').match(LEGACY_PERIOD_PATTERN)
	if (!period) return null
	const name = String(item.name ?? '').trim().slice(0, NAME_MAX_LENGTH)
	const day = Number(time[0])
	const start = Number(period[1])
	const end = Number(period[2])
	if (!name || !MY_WEEKDAYS.includes(day)) return null
	if (!SECTION_ORDER.includes(start) || !SECTION_ORDER.includes(end) || start > end) return null
	return {
		id: createId(),
		name,
		day,
		start,
		end,
		remark: String(item.classroom ?? '').trim().slice(0, REMARK_MAX_LENGTH)
	}
}

function migrateMyCourse() {
	const list = readJsonItem('myCourses', null, Array.isArray)
	if (!list) return
	writeJson('mcv2-my-courses', list.map(toMyCourse).filter(Boolean))
}

function legacyBgColor(setting) {
	if (setting.background === 'custom') {
		const color = String(setting.backgroundColor ?? '').toLowerCase()
		return { bg_color: color, bg_custom_color: color }
	}
	if (setting.background === 'dark-gray') return { bg_color: DARK_BG_COLOR }
	return { bg_color: LIGHT_BG_COLOR }
}

function migrateMyStyle() {
	const setting = readJsonItem('myCoursesSetting', null, isPlainObject)
	if (!setting) return

	// 背景圖搬成功之後才把 bg_type 改成 image, 搬不到就留在純色, 不會出現指定圖片卻沒有圖
	if (setting.background === 'image') localStorage.setItem('mcv2-legacy-bg', '1')

	// 不合法的值交給 my-course.js 的 normalizeStyle 落回預設, 這裡只負責對應
	writeJson('mcv2-my-style', {
		weekday: setting.showColTitle,
		section: setting.showRowTitle,
		h_line: setting.showRowLine,
		v_line: setting.showColLine,
		time_start: setting.showCourseTime,
		time_end: setting.showCourseTime,
		remark: setting.showCourseClassroom,
		margin: toNumber(Math.round(Number(setting.tableBorder) / LEGACY_CANVAS_WIDTH * 100)),
		theme: toNumber(setting.theme),
		bg_type: 'color',
		...legacyBgColor(setting)
	})
}

function migratePreference() {
	moveString('uid', 'mcv2-uid')
	moveString('term', 'mcv2-selected-term-id')
	moveString('dept', 'mcv2-selected-dept')
	moveString('ruleYear', 'mcv2-rule-year')
	moveString('ruleDept', 'mcv2-rule-dept')
	moveString('ruleRule', 'mcv2-rule-id')
	moveString('ruleTerm', 'mcv2-rule-enroll-term')

	const theme = localStorage.getItem('theme')
	if (theme) writeString('mcv2-theme', theme === 'system' ? 'auto' : theme)

	if (localStorage.getItem('acceptTerms')) writeString('mcv2-terms-agreed', '1')

	const grade_class = localStorage.getItem('class')
	if (grade_class) writeString('mcv2-selected-grade-class', grade_class.replace(' ', '-'))

	// 舊版的通識類別是「通識- 類別」, 新版改吃 general_type, 對不上就讓它落回全部
	const enroll_type = localStorage.getItem('type')
	if (enroll_type && !enroll_type.includes('-')) writeString('mcv2-selected-enroll-type', enroll_type)

	const conflict_mode = CONFLICT_MODE_MAP[localStorage.getItem('showConflict')]
	if (conflict_mode) writeString('mcv2-conflict-mode', conflict_mode)

	// 舊版一個 key 兩頁共用, 空字串是課表檢視
	const display_type = localStorage.getItem('displayType')
	if (display_type !== null) {
		const view_mode = display_type === '1' ? 'list' : 'table'
		writeString('mcv2-search-view', view_mode)
		writeString('mcv2-favorite-view', view_mode)
	}

	const sort_mode = SORT_MODE_MAP[localStorage.getItem('term_sort')]
	if (sort_mode) writeString('mcv2-rule-sort', sort_mode)
}

// 舊 key 是明文, 新版比對 sha256, 後端沒有一次性轉換過的話這裡搬過去的 token 會拿到 401
// 401 時 auth.js 會自己清掉 token, 所以兩種情況都不會壞
function migrateAuth() {
	moveString('auth_key', 'mcv2-auth-token')
}

function isLegacyKey(key) {
	return LEGACY_KEYS.includes(key) || LEGACY_PREFIXES.some(prefix => key.startsWith(prefix))
}

// 已經有備份就不覆蓋: 灰度期間使用者可能又被分到舊版寫回幾個 key, 第一包才是完整的原始資料
function backupLegacy() {
	if (localStorage.getItem('mcv2-legacy-backup') !== null) return
	const data = {}
	for (const key of Object.keys(localStorage)) {
		if (!isLegacyKey(key)) continue
		if (BACKUP_SKIP_KEYS.includes(key) || BACKUP_SKIP_PREFIXES.some(prefix => key.startsWith(prefix))) continue
		data[key] = localStorage.getItem(key)
	}
	writeJsonItem('mcv2-legacy-backup', { at: new Date().toISOString(), data })
}

function clearLegacy() {
	for (const key of Object.keys(localStorage)) {
		if (isLegacyKey(key)) localStorage.removeItem(key)
	}
}

function hasLegacyData() {
	return LEGACY_KEYS.some(key => localStorage.getItem(key) !== null)
}

function dropLegacyDb() {
	indexedDB.deleteDatabase(LEGACY_DB_NAME)
}

// 不帶版本開啟, onupgradeneeded 有跑就代表這個瀏覽器根本沒用過舊版, 帶版本會憑空建出一個空 db
function readLegacyBgImage() {
	return new Promise(resolve => {
		let created = false
		const request = indexedDB.open(LEGACY_DB_NAME)
		request.onupgradeneeded = () => {
			created = true
		}
		request.onerror = () => resolve(null)
		request.onsuccess = () => {
			const db = request.result
			if (created || !db.objectStoreNames.contains(LEGACY_DB_STORE)) {
				db.close()
				return resolve(null)
			}
			const get_request = db.transaction(LEGACY_DB_STORE, 'readonly').objectStore(LEGACY_DB_STORE).get(LEGACY_BG_IMAGE_KEY)
			get_request.onsuccess = () => {
				db.close()
				resolve(get_request.result ?? null)
			}
			get_request.onerror = () => {
				db.close()
				resolve(null)
			}
		}
	})
}

async function toBlob(data) {
	if (data instanceof Blob) return data
	if (typeof data !== 'string' || !data.startsWith('data:')) return null
	return (await fetch(data)).blob()
}

// 必須早於 App.vue 的 startMyCourseSync, 首次同步會用本地有沒有背景圖判斷要不要保留本地版本
export async function migrateLegacyBgImage() {
	if (localStorage.getItem('mcv2-legacy-bg') !== '1') return dropLegacyDb()
	try {
		const blob = await toBlob(await readLegacyBgImage())
		if (blob) {
			const { shrinkImage, applyMyBgImage } = await import('@/lib/my-course-image')
			const { useMyStyle } = await import('@/lib/my-course')
			await applyMyBgImage(await shrinkImage(blob))
			useMyStyle().my_style.value.bg_type = 'image'
		}
		localStorage.removeItem('mcv2-legacy-bg')
		dropLegacyDb()
	} catch (error) {
		console.error(error)
	}
}

if (hasLegacyData()) {
	backupLegacy()
	migrateFavorite()
	migrateMyCourse()
	migrateMyStyle()
	migratePreference()
	migrateAuth()
}
clearLegacy()
