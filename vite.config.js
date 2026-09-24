import { fileURLToPath, URL } from 'node:url'
import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync } from 'node:fs'
import { execSync } from 'node:child_process'
import { resolve, dirname } from 'node:path'
import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import { PAGE_META, DEFAULT_META, SITEMAP_EXCLUDE_PATHS, coursePageMeta, rulePageMeta } from './src/config/page-meta.js'
import { formatCourseTime, courseRoutePath, courseSummaryParts, courseGradeClass, formatDeptClass } from './src/lib/course-format.js'
import { yearFromCourseId, termIdFromCourseId, shortTermIdFromCourseId, formatTermLabel, formatTermShort } from './src/lib/term-format.js'
import { deptIds, deptGroups, ruleGroups, ruleIds, findRule, findSelfRule, ruleDescriptionText, ruleRoutePath, ruleDisplayName, DEFAULT_ID } from './src/lib/rule-format.js'
import { ogImageUrl } from './src/config/index.js'

// .env 只會進 import.meta.env, 這裡補上 build 期用的 process.env (loadEnv 內部就讓實際的環境變數蓋過 .env)
Object.assign(process.env, loadEnv('', process.cwd(), ['API_BASE', 'SITE_BASE']))

// API 主機, 前端 runtime 由 envPrefix 讀同一個 API_BASE
// build 期 (Node) 拿不到 import.meta.env, 也沒有 dev proxy 可走, 只能自己組絕對網址
const API_BASE = process.env.API_BASE || 'http://localhost:10000'
const BUILD_API_BASE_URL = `${API_BASE}/api`
const BUILD_OG_BASE_URL = `${API_BASE}/og`
// dev 與 preview 共用的反向代理, 讓前端不設 API_BASE 也能用相對路徑打本機 API
const DEV_PROXY = { '/api': API_BASE, '/auth': API_BASE, '/og': API_BASE }
// 站台網址, 沒指定就不產生 sitemap 也不注入 canonical, 避免寫出錯誤的絕對網址
const SITE_URL = process.env.SITE_BASE || ''
// 只有正式站開放收錄, stage 與本機 build 一律注入 noindex 並讓 robots.txt 全站 Disallow
const PROD_SITE_URL = 'https://mcut-course.com'
const IS_PROD = SITE_URL === PROD_SITE_URL
// 非正式站要拿掉 GA 與 AdSense, index.html 用這對註解標出範圍
const ANALYTICS_BLOCK_RE = /[\t ]*<!-- analytics[\s\S]*?<!-- \/analytics -->\n?/
// 檢查 meta 用的路由檔, 以及不需要在 PAGE_META 設定 meta 的路徑
const ROUTER_FILE = fileURLToPath(new URL('./src/router/index.js', import.meta.url))
const META_SKIP_PATHS = ['/']
// 預渲染內容要注入的掛載點, 屬性 (v-cloak 等) 原樣保留
const APP_ROOT_RE = /<div id="app"([^>]*)><\/div>/
// 共同科目的開課單位, 班級是虛擬的 (一班幾十門課), 課程頁不列同班級的其他課程
const COMMON_COURSE_DEPT_RE = /通識|^(外文|社會|體育)組-/
// 首屏一定會用到的第三方套件, 抽成獨立 chunk 讓瀏覽器跨版本快取 (只列全部都是首屏相依的, 否則會把延後載入的部分拉進首屏)
const VENDOR_CHUNKS = {
	'vendor-vue': /node_modules\/(vue|@vue|vue-router)\//,
	'vendor-class': /node_modules\/(tailwind-merge|clsx|class-variance-authority)\//
}
// 小於此大小 (bytes) 的 chunk 會併回引用它的 chunk, 避免產生大量幾百 bytes 的碎片
const MIN_CHUNK_SIZE = 3000
const BUILD_TIME = Date.now()
const GIT_SHA = (() => {
	try {
		return execSync('git rev-parse HEAD').toString().trim()
	} catch {
		return 'unknown'
	}
})()

function escapeHtml(text) {
	return text
		.replace(/&/g, '&amp;')
		.replace(/"/g, '&quot;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
}

function injectMeta(html, meta, path = '/') {
	const title = escapeHtml(meta.title)
	const description = escapeHtml(meta.description)
	const og_image = escapeHtml(ogImageUrl(path, BUILD_TIME, BUILD_OG_BASE_URL))
	const tags = [
		`<title>${title}</title>`,
		`<meta name="description" content="${description}" />`,
		!IS_PROD && '<meta name="robots" content="noindex, nofollow" />',
		`<meta property="og:title" content="${title}" />`,
		`<meta property="og:description" content="${description}" />`,
		`<meta property="og:image" content="${og_image}" />`
	].filter(Boolean).join('\n\t\t')
	return html.replace(/<title>[\s\S]*?<\/title>/, tags)
}

function injectRedirect(html, target) {
	const tags = [
		SITE_URL && `<link rel="canonical" href="${escapeHtml(SITE_URL + target)}" />`,
		`<meta http-equiv="refresh" content="0; url=${escapeHtml(target)}" />`
	].filter(Boolean).join('\n\t\t')
	return html.replace('</head>', `\t${tags}\n\t</head>`)
}

function injectCanonical(html, path) {
	if (!SITE_URL) return html
	const url = escapeHtml(SITE_URL + path)
	return html.replace('</head>', `\t<link rel="canonical" href="${url}" />\n\t\t<meta property="og:url" content="${url}" />\n\t</head>`)
}

function writePage(out_dir, path, html) {
	const file = resolve(out_dir, `${path.slice(1)}.html`)
	mkdirSync(dirname(file), { recursive: true })
	writeFileSync(file, html)
}

function renderLinkList(link_list) {
	return `<ul>${link_list.map(([text, path]) => `<li><a href="${escapeHtml(path)}">${escapeHtml(text)}</a></li>`).join('')}</ul>`
}

function injectBreadcrumb(html, crumbs) {
	if (!SITE_URL) return html
	const item_list = crumbs.map(([name, path], index) => ({ '@type': 'ListItem', position: index + 1, name, item: SITE_URL + path }))
	// JSON 本身不跳脫 <, 課名或規則名稱含 </script> 會提早結束標籤
	const json = JSON.stringify({ '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: item_list }).replace(/</g, '\\u003c')
	return html.replace('</head>', `\t<script type="application/ld+json">${json}</script>\n\t</head>`)
}

function injectAppContent(html, content) {
	if (!APP_ROOT_RE.test(html)) throw new Error('[page-meta] index.html 找不到 <div id="app"></div>, 無法注入預渲染內容')
	return html.replace(APP_ROOT_RE, (_, attrs) => `<div id="app"${attrs}>${content}</div>`)
}

function renderCourseContent(course, class_course_list, other_term_list) {
	const summary = courseSummaryParts(course)
	const times = (course.time || []).map(time => formatCourseTime(time, course)).join('　') || '未定'
	const badges = [course.enroll_type, course.general_type ? `通識 · ${course.general_type}` : '']
		.filter(Boolean)
		.map(text => `<span>${escapeHtml(text)}</span>`)
		.join('')
	const rows = [
		summary.dept_class,
		summary.teacher,
		times,
		summary.credit,
		summary.remark
	].filter(Boolean).map(text => `<li>${escapeHtml(text)}</li>`).join('')
	return [
		'<main>',
		`<p>${escapeHtml(formatTermLabel(termIdFromCourseId(course.id)))}・${escapeHtml(course.id)}</p>`,
		`<h1>${escapeHtml(course.name)}</h1>`,
		`<p>${badges}</p>`,
		`<ul>${rows}</ul>`,
		class_course_list.length ? `<h2>${escapeHtml(formatDeptClass(course))} 的其他課程</h2>${renderLinkList(class_course_list.map(item => [item.name, courseRoutePath(item.id)]))}` : '',
		other_term_list.length ? `<h2>其他學期的${escapeHtml(course.name)}</h2>${renderLinkList(other_term_list.map(item => [`${formatTermShort(termIdFromCourseId(item.id))} ${item.name}`, courseRoutePath(item.id)]))}` : '',
		'</main>'
	].join('')
}

function groupBy(list, keyOf) {
	const map = new Map()
	for (const item of list) {
		const key = keyOf(item)
		if (!map.has(key)) map.set(key, [])
		map.get(key).push(item)
	}
	return map
}

function courseCrumbs(course, route_path) {
	const term_id = termIdFromCourseId(course.id)
	const grade_class = courseGradeClass(course)
	const dept_query = `term_id=${term_id}&dept=${encodeURIComponent(course.dept)}`
	const dept_crumb = grade_class
		? [formatDeptClass(course), `/course?${dept_query}&grade_class=${encodeURIComponent(grade_class)}`]
		: [course.dept, `/course?${dept_query}`]
	return [
		[DEFAULT_META.title, '/'],
		[formatTermShort(term_id), `/course?term_id=${term_id}`],
		course.dept && dept_crumb,
		[course.name, route_path]
	].filter(Boolean)
}

async function fetchJson(path, retries = 2) {
	const url = `${BUILD_API_BASE_URL}${path}`
	const started_at = Date.now()
	try {
		const response = await fetch(url)
		console.log(`[page-meta] GET ${url} → ${response.status} (${Date.now() - started_at}ms)`)
		if (!response.ok) throw new Error(`HTTP ${response.status}`)
		return response.json()
	} catch (error) {
		console.log(`[page-meta] GET ${url} → ${error.message} (${Date.now() - started_at}ms)`)
		if (retries > 0) return fetchJson(path, retries - 1)
		throw new Error(`[page-meta] ${url} 失敗 (${error.message}), 中止 build`)
	}
}

function fetchCourseList(term_id = '') {
	return fetchJson(`/course/list/${term_id}`)
}

async function generateCoursePages(base_html, out_dir) {
	const { term_list } = await fetchCourseList()
	const term_data_list = await Promise.all(term_list.map(term_id => fetchCourseList(term_id)))
	const all_course_list = term_data_list.flatMap(term_data => term_data.course_list || [])
	const class_map = groupBy(all_course_list, course => [shortTermIdFromCourseId(course.id), course.dept, course.grade, course.class_group].join('|'))
	const name_map = groupBy(all_course_list, course => [course.dept, course.name].join('|'))
	const path_list = []
	for (const course of all_course_list) {
		const route_path = courseRoutePath(course.id)
		const term_id = termIdFromCourseId(course.id)
		const class_course_list = COMMON_COURSE_DEPT_RE.test(course.dept)
			? []
			: class_map.get([shortTermIdFromCourseId(course.id), course.dept, course.grade, course.class_group].join('|')).filter(item => item.id !== course.id)
		const other_term_map = new Map()
		for (const item of name_map.get([course.dept, course.name].join('|')) || []) {
			const item_term_id = termIdFromCourseId(item.id)
			if (item_term_id !== term_id && !other_term_map.has(item_term_id)) other_term_map.set(item_term_id, item)
		}
		const other_term_list = [...other_term_map.values()].sort((a, b) => b.id.localeCompare(a.id))
		const head_html = injectCanonical(injectBreadcrumb(injectMeta(base_html, coursePageMeta(course), route_path), courseCrumbs(course, route_path)), route_path)
		writePage(out_dir, route_path, injectAppContent(head_html, renderCourseContent(course, class_course_list, other_term_list)))
		path_list.push({ path: route_path, year: yearFromCourseId(course.id) })
	}
	// /course/1151 這種學期資料夾沒有同名 .html 時, GitHub Pages 補斜線與 Cloudflare 去斜線會無限轉址
	for (const short_term_id of new Set(all_course_list.map(course => shortTermIdFromCourseId(course.id)))) {
		const target = `/course?term_id=${termIdFromCourseId(short_term_id)}`
		writePage(out_dir, `/course/${short_term_id}`, injectRedirect(injectMeta(base_html, PAGE_META['/course'], '/course'), target))
	}
	console.log(`[page-meta] 共產生 ${path_list.length} 個課程頁面`)
	return path_list
}

function renderRuleContent(year, rule, description, program_list) {
	const rows = [
		rule.type,
		rule.dept ? `開設單位：${rule.dept}` : '',
		rule.contact ? `承辦人：${rule.contact}` : '',
		rule.email
	].filter(Boolean).map(text => `<li>${escapeHtml(text)}</li>`).join('')
	const categories = (description?.rule || []).map(item => {
		const categorys = (item.categorys || []).filter(Boolean).join('、')
		const text = [item.name, item.req, categorys].filter(Boolean).join('・')
		return `<li>${escapeHtml(text)}</li>`
	}).join('')
	return [
		'<main>',
		`<p>${escapeHtml(year)} 學年入學</p>`,
		`<h1>${escapeHtml(rule.name)}</h1>`,
		`<ul>${rows}</ul>`,
		categories ? `<h2>應修學分</h2><ul>${categories}</ul>` : '',
		program_list.length ? `<h2>學分學程</h2>${renderLinkList(program_list)}` : '',
		`<p><a href="${ruleRoutePath(year)}">${escapeHtml(year)} 學年入學畢業學分門檻</a></p>`,
		'</main>'
	].join('')
}

function renderRuleYearContent(rule_map, dept_map, year) {
	const dept_sections = deptGroups(dept_map, year).map(group => {
		const link_list = group.depts
			.map(dept => [dept.id, findSelfRule(rule_map, dept_map, year, dept.id)])
			.filter(([, rule]) => rule)
			.map(([dept_id, rule]) => [ruleDisplayName(rule), ruleRoutePath(year, dept_id, DEFAULT_ID)])
		return link_list.length ? `<h2>${escapeHtml(group.group_name)}</h2>${renderLinkList(link_list)}` : ''
	})
	const program_sections = ruleGroups(rule_map, dept_map, year, DEFAULT_ID).map(group =>
		`<h2>${escapeHtml(group.group_name)}</h2>${renderLinkList(group.rules.map(rule => [ruleDisplayName(rule), ruleRoutePath(year, DEFAULT_ID, rule.id)]))}`
	)
	return ['<main>', `<h1>${escapeHtml(year)} 學年入學畢業學分門檻</h1>`, ...dept_sections, ...program_sections, '</main>'].join('')
}

function fetchRuleList() {
	return fetchJson('/rule/list')
}

function fetchRuleDescription() {
	return fetchJson('/rule/description')
}

async function generateRulePages(base_html, out_dir) {
	const [data, description_map] = await Promise.all([fetchRuleList(), fetchRuleDescription()])
	const rule_map = data.rules || {}
	const dept_map = data.depts || {}
	const path_list = []
	const missing_list = []
	for (const year of Object.keys(rule_map)) {
		const year_path = ruleRoutePath(year)
		const year_meta = rulePageMeta(year)
		const year_crumbs = [[DEFAULT_META.title, '/'], ['畢業學分門檻', '/rule'], [`${year} 學年入學`, year_path]]
		const year_html = injectCanonical(injectBreadcrumb(injectMeta(base_html, year_meta, year_path), year_crumbs), year_path)
		writePage(out_dir, year_path, injectAppContent(year_html, renderRuleYearContent(rule_map, dept_map, year)))
		path_list.push({ path: year_path, year, in_sitemap: true })
		// 只選學年或系所時的網址也是資料夾, 沒有同名 .html 會無限轉址 (見 generateCoursePages)
		writePage(out_dir, `${year_path}/${DEFAULT_ID}`, injectRedirect(injectMeta(base_html, year_meta, year_path), year_path))
		for (const dept_id of [DEFAULT_ID, ...deptIds(dept_map, year)]) {
			if (dept_id !== DEFAULT_ID) writePage(out_dir, `${year_path}/${dept_id}`, injectCanonical(injectMeta(base_html, year_meta, year_path), year_path))
			for (const rule_id of ruleIds(rule_map, dept_map, year, dept_id)) {
				const rule = findRule(rule_map, dept_map, year, dept_id, rule_id)
				const route_path = ruleRoutePath(year, dept_id, rule_id)
				// 系所底下的學程與不選系所的版本內容相同, 統一以後者為準
				const canonical_path = dept_id !== DEFAULT_ID && rule_id !== DEFAULT_ID ? ruleRoutePath(year, DEFAULT_ID, rule_id) : route_path
				const description = description_map[year]?.[rule_id === DEFAULT_ID ? dept_id : rule_id]
				const description_text = ruleDescriptionText(description)
				if (!description_text) missing_list.push(`${route_path} (${rule.name})`)
				const display_name = ruleDisplayName(rule)
				const meta = rulePageMeta(year, display_name, description_text)
				const crumbs = [...year_crumbs, [display_name, canonical_path]]
				const program_list = dept_id !== DEFAULT_ID && rule_id === DEFAULT_ID
					? ruleGroups(rule_map, dept_map, year, dept_id).flatMap(group => group.rules.filter(item => !item.disabled)).map(item => [ruleDisplayName(item), ruleRoutePath(year, DEFAULT_ID, item.id)])
					: []
				const head_html = injectCanonical(injectBreadcrumb(injectMeta(base_html, meta, route_path), crumbs), canonical_path)
				writePage(out_dir, route_path, injectAppContent(head_html, renderRuleContent(year, rule, description, program_list)))
				path_list.push({ path: route_path, year, in_sitemap: canonical_path === route_path })
			}
		}
	}
	console.log(`[page-meta] 共產生 ${path_list.length} 個畢業學分門檻頁面 (含 ${Object.keys(rule_map).length} 個學年頁)`)
	if (missing_list.length) console.warn(`[page-meta] ${missing_list.length} 個畢業學分門檻頁面沒有課程類別, 沿用預設 description:\n\t${missing_list.join('\n\t')}`)
	return path_list
}

function latestYears(page_list) {
	return [...new Set(page_list.map(page => page.year))].sort((a, b) => a - b).slice(-3)
}

function latestYearPaths(page_list) {
	const year_list = latestYears(page_list)
	return page_list.filter(page => year_list.includes(page.year)).map(page => page.path)
}

function generateSitemap(out_dir, path_list) {
	if (!SITE_URL) return console.log('[page-meta] 未指定 BASE_URL, 略過 sitemap.xml')
	const urls = path_list.map(path => `\t<url>\n\t\t<loc>${SITE_URL}${path}</loc>\n\t</url>`).join('\n')
	const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`
	writeFileSync(resolve(out_dir, 'sitemap.xml'), xml)
	console.log(`[page-meta] sitemap.xml 共 ${path_list.length} 個網址`)
}

function renderHomeContent(rule_year_list) {
	const page_links = Object.entries(PAGE_META)
		.filter(([path]) => !SITEMAP_EXCLUDE_PATHS.includes(path))
		.map(([path, meta]) => [meta.title.split(' | ')[0], path])
	const rule_links = [...rule_year_list].reverse().map(year => [`${year} 學年入學畢業學分門檻`, ruleRoutePath(year)])
	return [
		'<main>',
		`<h1>${escapeHtml(DEFAULT_META.title)}</h1>`,
		`<p>${escapeHtml(DEFAULT_META.description)}</p>`,
		renderLinkList([...page_links, ...rule_links]),
		'</main>'
	].join('')
}

function checkDirectoryPages(out_dir) {
	const missing_list = []
	const walk = dir => {
		for (const entry of readdirSync(resolve(out_dir, dir), { withFileTypes: true })) {
			if (!entry.isDirectory()) continue
			const path = `${dir}/${entry.name}`
			if (!existsSync(resolve(out_dir, `${path}.html`))) missing_list.push(`/${path}`)
			walk(path)
		}
	}
	for (const dir of ['course', 'rule']) walk(dir)
	if (missing_list.length) console.warn(`[page-meta] ${missing_list.length} 個資料夾沒有同名 .html, 在正式站會無限轉址:\n\t${missing_list.join('\n\t')}`)
	else console.log('[page-meta] 資料夾都有同名 .html')
}

function generateRobots(out_dir) {
	const lines = IS_PROD
		? ['User-agent: *', 'Allow: /', '', `Sitemap: ${SITE_URL}/sitemap.xml`]
		: ['User-agent: *', 'Disallow: /']
	writeFileSync(resolve(out_dir, 'robots.txt'), `${lines.join('\n')}\n`)
	console.log(`[page-meta] robots.txt ${IS_PROD ? `開放收錄, sitemap 指向 ${SITE_URL}` : '全站 Disallow'}`)
}

function routeBlocks() {
	return readFileSync(ROUTER_FILE, 'utf-8')
		.split(/\bpath:\s*/)
		.slice(1)
		.map(block => ({
			path: block.match(/^'([^']*)'/)?.[1],
			redirect: block.match(/\bredirect:\s*'([^']*)'/)?.[1],
			is_redirect: /\bredirect\s*:/.test(block)
		}))
		.filter(route => route.path)
}

function redirectRoutes() {
	return routeBlocks().filter(route => route.redirect && !route.path.includes(':') && !route.redirect.includes(':'))
}

function generateRedirectPages(base_html, out_dir) {
	const route_list = redirectRoutes()
	const missing_list = []
	for (const route of route_list) {
		if (!PAGE_META[route.redirect]) missing_list.push(`${route.path} → ${route.redirect}`)
		const meta = PAGE_META[route.redirect] || DEFAULT_META
		const html = injectRedirect(injectMeta(base_html, meta, route.redirect), route.redirect)
		const file = resolve(out_dir, `${route.path.slice(1)}.html`)
		mkdirSync(dirname(file), { recursive: true })
		writeFileSync(file, html)
	}
	console.log(`[page-meta] 共產生 ${route_list.length} 個轉址頁面: ${route_list.map(route => `${route.path} → ${route.redirect}`).join(', ')}`)
	if (missing_list.length) console.warn(`[page-meta] ${missing_list.length} 個轉址頁面的目標沒有設定 meta, 沿用預設:\n\t${missing_list.join('\n\t')}`)
}

function routePaths() {
	const route_list = routeBlocks()
		.filter(route => !route.is_redirect)
		.map(route => route.path)
	return {
		static_paths: route_list.filter(path => !path.includes(':')),
		dynamic_prefixes: route_list.filter(path => path.includes(':')).map(path => path.slice(0, path.indexOf('/:'))).filter(Boolean)
	}
}

function checkPageMeta() {
	const { static_paths, dynamic_prefixes } = routePaths()
	const meta_paths = Object.keys(PAGE_META)
	const missing_list = static_paths.filter(path => !META_SKIP_PATHS.includes(path) && !meta_paths.includes(path))
	const unused_list = meta_paths.filter(path => !static_paths.includes(path) && !dynamic_prefixes.includes(path))
	if (missing_list.length) console.warn(`[page-meta] ${missing_list.length} 個頁面沒有設定 meta, 沿用預設:\n\t${missing_list.join('\n\t')}`)
	if (unused_list.length) console.warn(`[page-meta] ${unused_list.length} 個 PAGE_META 沒有對應的頁面:\n\t${unused_list.join('\n\t')}`)
	if (!missing_list.length && !unused_list.length) console.log(`[page-meta] ${static_paths.length} 個頁面的 meta 檢查通過`)
}

function analyticsPlugin() {
	return {
		name: 'analytics',
		transformIndexHtml(html) {
			return IS_PROD ? html : html.replace(ANALYTICS_BLOCK_RE, '')
		}
	}
}

function pageMetaPlugin() {
	let out_dir = 'dist'
	return {
		name: 'page-meta',
		apply: 'build',
		configResolved(config) {
			out_dir = config.build.outDir
		},
		async closeBundle() {
			const base_html = readFileSync(resolve(out_dir, 'index.html'), 'utf-8')
			for (const [path, meta] of Object.entries(PAGE_META)) {
				const html = SITEMAP_EXCLUDE_PATHS.includes(path) ? injectMeta(base_html, meta, path) : injectCanonical(injectBreadcrumb(injectMeta(base_html, meta, path), [[DEFAULT_META.title, '/'], [meta.title.split(' | ')[0], path]]), path)
				writePage(out_dir, path, html)
			}
			writeFileSync(resolve(out_dir, '404.html'), injectMeta(base_html, DEFAULT_META))
			generateRedirectPages(base_html, out_dir)
			const course_page_list = await generateCoursePages(base_html, out_dir)
			const rule_page_list = await generateRulePages(base_html, out_dir)
			writeFileSync(resolve(out_dir, 'index.html'), injectAppContent(injectCanonical(injectMeta(base_html, DEFAULT_META, '/'), '/'), renderHomeContent(latestYears(rule_page_list))))
			const meta_paths = Object.keys(PAGE_META).filter(path => !SITEMAP_EXCLUDE_PATHS.includes(path))
			generateSitemap(out_dir, ['/', ...meta_paths, ...latestYearPaths(course_page_list), ...latestYearPaths(rule_page_list.filter(page => page.in_sitemap))])
			generateRobots(out_dir)
			checkPageMeta()
			checkDirectoryPages(out_dir)
		}
	}
}

export default defineConfig({
	plugins: [vue(), tailwindcss(), analyticsPlugin(), pageMetaPlugin()],
	envPrefix: ['VITE_', 'API_BASE'],
	define: {
		__BUILD_TIME__: JSON.stringify(BUILD_TIME),
		__IS_PROD__: JSON.stringify(IS_PROD),
		__GIT_SHA__: JSON.stringify(GIT_SHA),
		__VUE_OPTIONS_API__: false,
		__VUE_PROD_DEVTOOLS__: false,
		__VUE_PROD_HYDRATION_MISMATCH_DETAILS__: false
	},
	build: {
		target: 'es2022',
		minify: 'terser',
		terserOptions: {
			compress: { ecma: 2020, passes: 3, drop_console: ['log', 'debug', 'info'], pure_getters: true, unsafe_arrows: true, unsafe_methods: true },
			format: { comments: false }
		},
		rollupOptions: {
			output: {
				experimentalMinChunkSize: MIN_CHUNK_SIZE,
				manualChunks(id) {
					for (const [name, re] of Object.entries(VENDOR_CHUNKS)) {
						if (re.test(id)) return name
					}
				}
			}
		}
	},
	resolve: {
		alias: {
			'@': fileURLToPath(new URL('./src', import.meta.url))
		}
	},
	server: {
		port: 10010,
		allowedHosts: ['.mcut-course.com'],
		proxy: DEV_PROXY,
		hmr: {
			overlay: true
		},
	},
	preview: {
		port: 10010,
		proxy: DEV_PROXY
	}
})
