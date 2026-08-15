import { WEEKDAY_LABELS, visibleSections, sectionSpan, formatSectionRange, formatSectionStart } from '@/lib/course-format'
import { MY_WEEKDAYS, findTheme, themeColor, isHexColor } from '@/lib/my-course'

// 課表一律以 9:16 的虛擬座標系排版, 顯示與下載都只是等比縮放
export const BASE_WIDTH = 1080
export const BASE_HEIGHT = 1920

// 課表版面尺寸 (外距 0 時的虛擬座標), 節次欄與星期列隱藏時該尺寸視為 0
// 外距變大時整張課表 (含尺寸與字級) 一律乘上 table_scale 等比縮小
const TIME_COL_WIDTH = 60
const HEADER_HEIGHT = 54
const BLOCK_GAP = 1
const BLOCK_PADDING = 16

// 各處字級 (外距 0 時的虛擬座標) 與行高倍率
const HEADER_FONT_SIZE = 28
const SECTION_FONT_SIZE = 28
const LINE_HEIGHT = 1.3

// 隔線寬度 (外距 0 時的虛擬座標)
const LINE_WIDTH = 1.5

// 課程方塊的字級改由方塊寬度決定: 課名一行剛好放 NAME_CHARS_PER_LINE 個全形字
// 時間與備註為課名字級的 META_FONT_RATIO 倍
// 另以單節高度為上限, 確保一節的課至少放得下課名與時間各一行
const NAME_CHARS_PER_LINE = 5.2
const META_FONT_RATIO = 0.8

// canvas 用字型 (中文優先, 與 body 字型一致)
const FONT_FAMILY = "'noto sans tc', 'pingfang tc', 'microsoft jhenghei', 'helvetica neue', sans-serif"

// 星期與節次的文字色, 兩者取與底色對比較高的那一個
const TEXT_ON_DARK = '#f2f5f6'
const TEXT_ON_LIGHT = '#22292b'

// 節次是次要文字, 由文字色往底色最多混 MUTED_MIX_MAX (每次退 MUTED_MIX_STEP)
// 但對比不得低於 MIN_MUTED_CONTRAST, 中間亮度的底色上就會自動退回與星期同色
const MIN_MUTED_CONTRAST = 4
const MUTED_MIX_MAX = 0.45
const MUTED_MIX_STEP = 0.05

// 背景圖的局部亮暗不一, 星期與節次額外加一圈與底色反向的陰影 (虛擬座標的模糊半徑)
const TEXT_SHADOW_BLUR = 10
const TEXT_SHADOW_ALPHA = 0.55

// 判斷背景圖片明暗時的取樣尺寸 (整張縮到這個大小取平均色)
const SAMPLE_SIZE = 32

// 背景圖時每個星期格與節次格各自取樣自己底下的底色, 每格最多取這麼多點平均
const CELL_SAMPLE_POINTS = 64

// 背景圖片上的遮罩不透明度 (壓低圖片對比, 讓文字在花色照片上仍讀得到)
const SCRIM_ALPHA = 0.35

// 判斷隔線是否落在課表最外緣的容許誤差 (最外緣一律不畫)
const EDGE_EPSILON = 0.5

// 下載圖片的寬度 (高度為 16 / 9 倍)
export const EXPORT_WIDTH = 1080

function hexRgb(hex) {
	return [1, 3, 5].map(index => parseInt(hex.slice(index, index + 2), 16))
}

function srgbChannel(value) {
	const channel = value / 255
	return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4
}

function luminance([r, g, b]) {
	return 0.2126 * srgbChannel(r) + 0.7152 * srgbChannel(g) + 0.0722 * srgbChannel(b)
}

function contrastRatio(a, b) {
	return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05)
}

function mixRgb(from, to, ratio) {
	return from.map((value, index) => Math.round(value + (to[index] - value) * ratio))
}

function rgbCss([r, g, b]) {
	return `rgb(${r}, ${g}, ${b})`
}

function isDarkBase(rgb) {
	const base = luminance(rgb)
	return contrastRatio(base, luminance(hexRgb(TEXT_ON_DARK))) >= contrastRatio(base, luminance(hexRgb(TEXT_ON_LIGHT)))
}

function mutedRgb(text_rgb, base_rgb) {
	const base = luminance(base_rgb)
	for (let ratio = MUTED_MIX_MAX; ratio > 0; ratio -= MUTED_MIX_STEP) {
		const mixed = mixRgb(text_rgb, base_rgb, ratio)
		if (contrastRatio(luminance(mixed), base) >= MIN_MUTED_CONTRAST) return mixed
	}
	return text_rgb
}

export function imageColor(image) {
	const canvas = document.createElement('canvas')
	canvas.width = SAMPLE_SIZE
	canvas.height = SAMPLE_SIZE
	const ctx = canvas.getContext('2d', { willReadFrequently: true })
	if (!ctx) return [255, 255, 255]
	ctx.drawImage(image, 0, 0, SAMPLE_SIZE, SAMPLE_SIZE)
	const { data } = ctx.getImageData(0, 0, SAMPLE_SIZE, SAMPLE_SIZE)
	const total = [0, 0, 0]
	for (let i = 0; i < data.length; i += 4) {
		total[0] += data[i]
		total[1] += data[i + 1]
		total[2] += data[i + 2]
	}
	const count = data.length / 4
	return total.map(value => Math.round(value / count))
}

function baseColors(base) {
	const dark = isDarkBase(base)
	const text_rgb = hexRgb(dark ? TEXT_ON_DARK : TEXT_ON_LIGHT)
	return { dark, text: rgbCss(text_rgb), muted: rgbCss(mutedRgb(text_rgb, base)) }
}

function tableColors(bg_color, background) {
	const bg = isHexColor(bg_color) ? bg_color : '#ffffff'
	const base = background?.rgb ?? hexRgb(bg)
	const dark = isDarkBase(base)
	const scrim_rgb = dark ? [0, 0, 0] : [255, 255, 255]
	const surface = background ? mixRgb(base, scrim_rgb, SCRIM_ALPHA) : base
	return {
		bg,
		scrim: `rgba(${scrim_rgb.join(', ')}, ${SCRIM_ALPHA})`,
		line: dark ? 'rgba(255, 255, 255, 0.24)' : 'rgba(0, 0, 0, 0.16)',
		...baseColors(surface)
	}
}

function sampleColors(ctx, x, y, w, h, scale) {
	const sx = Math.max(Math.round(x * scale), 0)
	const sy = Math.max(Math.round(y * scale), 0)
	const sw = Math.min(Math.max(Math.round(w * scale), 1), ctx.canvas.width - sx)
	const sh = Math.min(Math.max(Math.round(h * scale), 1), ctx.canvas.height - sy)
	if (sw <= 0 || sh <= 0) return null
	let data = null
	try {
		data = ctx.getImageData(sx, sy, sw, sh).data
	} catch (error) {
		return null
	}
	const step = Math.max(Math.round(Math.sqrt((sw * sh) / CELL_SAMPLE_POINTS)), 1)
	const total = [0, 0, 0]
	let count = 0
	for (let py = 0; py < sh; py += step) {
		for (let px = 0; px < sw; px += step) {
			const index = (py * sw + px) * 4
			total[0] += data[index]
			total[1] += data[index + 1]
			total[2] += data[index + 2]
			count++
		}
	}
	if (!count) return null
	return baseColors(total.map(value => Math.round(value / count)))
}

function setTextShadow(ctx, dark, table_scale) {
	ctx.shadowColor = dark ? `rgba(0, 0, 0, ${TEXT_SHADOW_ALPHA})` : `rgba(255, 255, 255, ${TEXT_SHADOW_ALPHA})`
	ctx.shadowBlur = TEXT_SHADOW_BLUR * table_scale
}

function drawCover(ctx, image) {
	if (!image.width || !image.height) return
	const scale = Math.max(BASE_WIDTH / image.width, BASE_HEIGHT / image.height)
	const width = image.width * scale
	const height = image.height * scale
	ctx.drawImage(image, (BASE_WIDTH - width) / 2, (BASE_HEIGHT - height) / 2, width, height)
}

function blockColors(theme, index) {
	return {
		fill: theme.colors[index],
		title: themeColor(theme.title, index),
		text: themeColor(theme.text, index)
	}
}

export function layoutTimetable(courses, style) {
	const sections = visibleSections(courses.map(course => sectionSpan(course.start, course.end)))
	// 外距上下左右都取各自邊長的百分比, 課表本身才是整張等比縮放 (換行位置不隨外距改變)
	const margin_x = (BASE_WIDTH * style.margin) / 100
	const margin_y = (BASE_HEIGHT * style.margin) / 100
	const grid_x = margin_x
	const grid_y = margin_y
	const grid_width = BASE_WIDTH - margin_x * 2
	const grid_height = BASE_HEIGHT - margin_y * 2
	const table_scale = grid_width / BASE_WIDTH
	const block_gap = BLOCK_GAP * table_scale
	const time_col_width = style.section ? TIME_COL_WIDTH * table_scale : 0
	const header_height = style.weekday ? HEADER_HEIGHT * table_scale : 0
	const day_width = (grid_width - time_col_width) / MY_WEEKDAYS.length
	const row_height = (grid_height - header_height) / sections.length
	const blocks = []
	const theme = findTheme(style.theme)
	const name_indexes = new Map()

	courses.forEach(course => {
		const day_index = MY_WEEKDAYS.indexOf(course.day)
		const start = sections.indexOf(course.start)
		const end = sections.indexOf(course.end)
		if (day_index < 0 || start < 0 || end < 0) return
		if (!name_indexes.has(course.name)) name_indexes.set(course.name, name_indexes.size % theme.colors.length)
		blocks.push({
			course,
			color_index: name_indexes.get(course.name),
			x: grid_x + time_col_width + day_index * day_width + block_gap,
			y: grid_y + header_height + start * row_height + block_gap,
			w: day_width - block_gap * 2,
			h: (end - start + 1) * row_height - block_gap * 2
		})
	})

	return { sections, blocks, grid_x, grid_y, grid_width, grid_height, time_col_width, header_height, day_width, row_height, table_scale, block_gap }
}

export function hitTimetable(layout, x, y) {
	for (const block of layout.blocks) {
		if (x < block.x || x > block.x + block.w) continue
		if (y < block.y || y > block.y + block.h) continue
		return { type: 'course', course: block.course }
	}
	const grid_left = layout.grid_x + layout.time_col_width
	const grid_top = layout.grid_y + layout.header_height
	if (x < grid_left || x > layout.grid_x + layout.grid_width) return null
	if (y < grid_top || y > layout.grid_y + layout.grid_height) return null
	const day = MY_WEEKDAYS[Math.floor((x - grid_left) / layout.day_width)]
	const section = layout.sections[Math.floor((y - grid_top) / layout.row_height)]
	if (!day || section === undefined) return null
	return { type: 'empty', day, section }
}

function roundRectPath(ctx, x, y, w, h, radius) {
	ctx.beginPath()
	if (ctx.roundRect) ctx.roundRect(x, y, w, h, radius)
	else ctx.rect(x, y, w, h)
}

function wrapText(ctx, text, max_width) {
	const lines = []
	let line = ''
	for (const char of String(text)) {
		if (char === '\n') {
			lines.push(line)
			line = ''
			continue
		}
		const next = line + char
		if (line && ctx.measureText(next).width > max_width) {
			lines.push(line)
			line = char
			continue
		}
		line = next
	}
	if (line) lines.push(line)
	return lines
}

function fitFontSize(ctx, text, max_width, font_size) {
	ctx.font = `${font_size}px ${FONT_FAMILY}`
	const width = ctx.measureText(text).width
	if (width <= max_width) return font_size
	return Math.floor(((font_size * max_width) / width) * 10) / 10
}

function drawBlockText(ctx, block, colors, style, layout) {
	const padding = BLOCK_PADDING * layout.table_scale
	const max_width = block.w - padding * 2
	const bottom = block.y + block.h - padding
	if (max_width <= 0) return
	const row_space = layout.row_height - layout.block_gap * 2 - padding * 2
	const max_by_height = row_space / (style.time_start ? LINE_HEIGHT + META_FONT_RATIO : 1)
	const name_font_size = Math.min(max_width / NAME_CHARS_PER_LINE, Math.max(max_by_height, 0))
	const meta_font_size = name_font_size * META_FONT_RATIO
	ctx.textAlign = 'left'
	ctx.textBaseline = 'top'
	let y = block.y + padding

	ctx.font = `500 ${name_font_size}px ${FONT_FAMILY}`
	ctx.fillStyle = colors.title
	for (const line of wrapText(ctx, block.course.name, max_width)) {
		if (y + name_font_size > bottom) return
		ctx.fillText(line, block.x + padding, y)
		y += name_font_size * LINE_HEIGHT
	}

	ctx.fillStyle = colors.text

	if (style.time_start) {
		const text = style.time_end
			? formatSectionRange([block.course.start, block.course.end])
			: formatSectionStart(block.course.start)
		const size = fitFontSize(ctx, text, max_width, meta_font_size)
		if (y + size <= bottom) {
			ctx.font = `${size}px ${FONT_FAMILY}`
			ctx.fillText(text, block.x + padding, y)
			y += size * LINE_HEIGHT
		}
	}

	if (!style.remark || !block.course.remark) return
	ctx.font = `${meta_font_size}px ${FONT_FAMILY}`
	for (const line of wrapText(ctx, block.course.remark, max_width)) {
		if (y + meta_font_size > bottom) return
		ctx.fillText(line, block.x + padding, y)
		y += meta_font_size * LINE_HEIGHT
	}
}

export function drawTimetable(canvas, layout, options) {
	const { style, background = null, css_width, pixel_ratio = 1 } = options
	const { sections, blocks, grid_x, grid_y, grid_width, grid_height, time_col_width, header_height, day_width, row_height, table_scale } = layout
	const ctx = canvas.getContext('2d')
	if (!ctx || css_width <= 0) return

	const bg_image = style.bg_type === 'image' && background?.image ? background : null
	const table = tableColors(style.bg_color, bg_image)
	const theme = findTheme(style.theme)
	const scale = (css_width / BASE_WIDTH) * pixel_ratio
	canvas.width = Math.round(BASE_WIDTH * scale)
	canvas.height = Math.round(BASE_HEIGHT * scale)
	ctx.setTransform(scale, 0, 0, scale, 0, 0)

	ctx.fillStyle = table.bg
	ctx.fillRect(0, 0, BASE_WIDTH, BASE_HEIGHT)

	if (bg_image) {
		drawCover(ctx, bg_image.image)
		ctx.fillStyle = table.scrim
		ctx.fillRect(0, 0, BASE_WIDTH, BASE_HEIGHT)
	}

	const grid_right = grid_x + grid_width
	const grid_bottom = grid_y + grid_height

	ctx.strokeStyle = table.line
	ctx.lineWidth = LINE_WIDTH * table_scale

	if (style.h_line) {
		ctx.beginPath()
		for (let i = 0; i <= sections.length; i++) {
			const y = grid_y + header_height + i * row_height
			if (y <= grid_y + EDGE_EPSILON || y >= grid_bottom - EDGE_EPSILON) continue
			ctx.moveTo(grid_x, y)
			ctx.lineTo(grid_right, y)
		}
		ctx.stroke()
	}

	if (style.v_line) {
		ctx.beginPath()
		for (let i = 0; i <= MY_WEEKDAYS.length; i++) {
			const x = grid_x + time_col_width + i * day_width
			if (x <= grid_x + EDGE_EPSILON || x >= grid_right - EDGE_EPSILON) continue
			ctx.moveTo(x, grid_y)
			ctx.lineTo(x, grid_bottom)
		}
		ctx.stroke()
	}

	ctx.textAlign = 'center'
	ctx.textBaseline = 'middle'

	if (style.weekday) {
		const cells = MY_WEEKDAYS.map((day, index) => {
			const x = grid_x + time_col_width + index * day_width
			return { day, x, colors: (bg_image && sampleColors(ctx, x, grid_y, day_width, header_height, scale)) || table }
		})
		ctx.font = `500 ${HEADER_FONT_SIZE * table_scale}px ${FONT_FAMILY}`
		for (const cell of cells) {
			if (bg_image) setTextShadow(ctx, cell.colors.dark, table_scale)
			ctx.fillStyle = cell.colors.text
			ctx.fillText(WEEKDAY_LABELS[cell.day], cell.x + day_width / 2, grid_y + header_height / 2)
		}
	}

	if (style.section) {
		const cells = sections.map((section, index) => {
			const y = grid_y + header_height + index * row_height
			return { section, y, colors: (bg_image && sampleColors(ctx, grid_x, y, time_col_width, row_height, scale)) || table }
		})
		ctx.font = `${SECTION_FONT_SIZE * table_scale}px ${FONT_FAMILY}`
		for (const cell of cells) {
			if (bg_image) setTextShadow(ctx, cell.colors.dark, table_scale)
			ctx.fillStyle = cell.colors.muted
			ctx.fillText(String(cell.section), grid_x + time_col_width / 2, cell.y + row_height / 2)
		}
	}

	ctx.shadowColor = 'transparent'
	ctx.shadowBlur = 0

	const block_radius = style.radius * table_scale
	// 透明度只作用在填色, 方塊內文字一律不透明
	const block_alpha = 1 - style.transparency / 100

	for (const block of blocks) {
		const colors = blockColors(theme, block.color_index)
		roundRectPath(ctx, block.x, block.y, block.w, block.h, block_radius)
		ctx.globalAlpha = block_alpha
		ctx.fillStyle = colors.fill
		ctx.fill()
		ctx.globalAlpha = 1
		ctx.save()
		roundRectPath(ctx, block.x, block.y, block.w, block.h, block_radius)
		ctx.clip()
		drawBlockText(ctx, block, colors, style, layout)
		ctx.restore()
	}
}
