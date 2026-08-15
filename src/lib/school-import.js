import { SECTION_ORDER, sectionSpan } from '@/lib/course-format'

// 學校課表表頭的欄位關鍵字, 比對時長關鍵字優先 (避免「課程」誤中「課程代號」)
const COLUMN_KEYWORDS = {
	name: ['課程名稱', '科目名稱', '課程'],
	code: ['科目代號', '課程代號', '科目編號', '代號'],
	day: ['星期'],
	start: ['起始節次', '開始節次'],
	end: ['結束節次'],
	room: ['教室', '上課地點'],
	drop: ['停修'],
	exempt: ['抵免']
}

const COLUMN_MATCHERS = Object.entries(COLUMN_KEYWORDS)
	.flatMap(([key, keywords]) => keywords.map(keyword => [keyword, key]))
	.sort((a, b) => b[0].length - a[0].length)

function cleanText(value) {
	return String(value || '').replace(/\s+/g, ' ').trim()
}

function rowWidth(rows) {
	return rows.reduce((width, row) => Math.max(width, row.cells.length), 0)
}

function tableRows(table) {
	const rows = []
	for (const tr of table.querySelectorAll(':scope > tr, :scope > thead > tr, :scope > tbody > tr, :scope > tfoot > tr')) {
		const cells = [...tr.children].filter(cell => cell.tagName === 'TD' || cell.tagName === 'TH')
		if (!cells.length) continue
		rows.push({
			header: cells.some(cell => cell.tagName === 'TH'),
			cells: cells.map(cell => cleanText(cell.textContent))
		})
	}
	return rows
}

function textRows(text) {
	const rows = []
	for (const line of text.split(/\r?\n/)) {
		const cells = line.split('\t').map(cleanText)
		if (cells.some(cell => cell)) rows.push({ header: false, cells })
	}
	return rows
}

function rowCandidates(text, html) {
	const source = html || (/<(table|tbody|tr|td|th)[\s>]/i.test(text) ? text : '')
	if (source) {
		const doc = new DOMParser().parseFromString(source, 'text/html')
		const candidates = []
		for (const table of doc.querySelectorAll('table')) {
			const rows = tableRows(table)
			if (rows.length) candidates.push(rows)
		}
		if (candidates.length) return candidates
	}
	const rows = textRows(text)
	return rows.length ? [rows] : []
}

function columnsFromHeader(cells) {
	const columns = {}
	cells.forEach((cell, index) => {
		if (!cell) return
		const matched = COLUMN_MATCHERS.find(([keyword]) => cell.includes(keyword))
		if (!matched) return
		if (columns[matched[1]] == null) columns[matched[1]] = index
	})
	return ['name', 'day', 'start', 'end'].every(key => columns[key] != null) ? columns : null
}

function toDay(value) {
	const text = value.replace(/^(星期|週|周)/, '')
	const label_index = ['日', '一', '二', '三', '四', '五', '六'].indexOf(text)
	if (label_index >= 0) return label_index
	const number = Number(text)
	if (!text || !Number.isInteger(number) || number < 0 || number > 7) return null
	return number % 7
}

function toSection(value) {
	const number = Number(value)
	return value && SECTION_ORDER.includes(number) ? number : null
}

// 只留下欄數與多數列相同的資料列, 避免標題行之類的雜訊讓欄位推斷失敗
function mainRows(rows) {
	const counts = new Map()
	for (const row of rows) counts.set(row.cells.length, (counts.get(row.cells.length) || 0) + 1)
	let width = 0
	let max = 0
	for (const [length, count] of counts) {
		if (count < max || (count === max && length < width)) continue
		max = count
		width = length
	}
	return rows.filter(row => row.cells.length === width)
}

function isTimeColumns(rows, index) {
	return rows.every(row => {
		const day = toDay(row.cells[index] || '')
		const start = toSection(row.cells[index + 1] || '')
		const end = toSection(row.cells[index + 2] || '')
		return day != null && start != null && end != null && start <= end
	})
}

// 每一列都有值且不是純數字的欄位, 用來推斷課程名稱與教室
function textColumn(rows, used, from) {
	const width = rowWidth(rows)
	for (let index = from; index < width; index++) {
		if (used.includes(index)) continue
		if (rows.every(row => row.cells[index] && !/^\d+(\.\d+)?$/.test(row.cells[index]))) return index
	}
	return null
}

function columnsFromShape(rows) {
	const width = rowWidth(rows)
	for (let index = 0; index + 2 < width; index++) {
		if (!isTimeColumns(rows, index)) continue
		const time_columns = [index, index + 1, index + 2]
		const name = textColumn(rows, time_columns, 0)
		if (name == null) return null
		const room = textColumn(rows, [...time_columns, name], index + 3)
		const columns = { name, day: index, start: index + 1, end: index + 2 }
		if (room != null) columns.room = room
		return columns
	}
	return null
}

function cellAt(cells, index) {
	return index == null ? '' : cells[index] || ''
}

function rowToCourse(cells, columns) {
	const name = cellAt(cells, columns.name)
	const day = toDay(cellAt(cells, columns.day))
	const start = toSection(cellAt(cells, columns.start))
	const end = toSection(cellAt(cells, columns.end))
	if (!name || day == null || start == null || end == null || start > end) return null
	return {
		code: cellAt(cells, columns.code),
		name,
		room: cellAt(cells, columns.room),
		dropped: Boolean(cellAt(cells, columns.drop)),
		exempted: Boolean(cellAt(cells, columns.exempt)),
		day,
		start,
		end
	}
}

function parseRows(rows) {
	let columns = null
	let body = null
	for (const [index, row] of rows.entries()) {
		columns = columnsFromHeader(row.cells)
		if (!columns) continue
		body = rows.slice(index + 1)
		break
	}
	if (!body) {
		body = mainRows(rows.filter(row => !row.header))
		if (!body.length) return []
		columns = columnsFromShape(body)
	}
	if (!columns) return null
	const list = []
	for (const row of body) {
		const course = rowToCourse(row.cells, columns)
		if (course) list.push(course)
	}
	return list
}

// 同一門課上多天會是多列, 用科目代號 (沒有就用課程名稱) 合併成一門課
function groupCourses(list) {
	const map = new Map()
	for (const row of list) {
		const key = row.code || row.name
		let course = map.get(key)
		if (!course) {
			course = { id: key, name: row.name, room: row.room, blocked: '', time: [] }
			map.set(key, course)
		}
		if (row.dropped) course.blocked = 'drop'
		else if (row.exempted && !course.blocked) course.blocked = 'exempt'
		if (course.time.some(time => time.day === row.day && time.section[0] === row.start)) continue
		course.time.push({ day: row.day, section: sectionSpan(row.start, row.end) })
	}
	return [...map.values()]
}

export function parseSchoolCourses({ text = '', html = '' } = {}) {
	let best = null
	for (const rows of rowCandidates(text, html)) {
		const parsed = parseRows(rows)
		if (!parsed) continue
		if (!best || parsed.length > best.length) best = parsed
	}
	if (!best) return { error: 'format', courses: [] }
	if (!best.length) return { error: 'no_course', courses: [] }
	return { error: '', courses: groupCourses(best) }
}
