import { fileURLToPath, URL } from 'node:url'
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { execSync } from 'node:child_process'
import { resolve, dirname } from 'node:path'
import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import { PAGE_META, DEFAULT_META, SITEMAP_EXCLUDE_PATHS, coursePageMeta, rulePageMeta } from './src/config/page-meta.js'
import { formatCourseTime, courseRoutePath, courseSummaryParts } from './src/lib/course-format.js'
import { yearFromCourseId, termIdFromCourseId, formatTermLabel } from './src/lib/term-format.js'
import { deptGroups, findSelfRule, ruleDescriptionText, ruleRoutePath, DEFAULT_ID } from './src/lib/rule-format.js'
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
// 檢查 meta 用的路由檔, 以及不需要在 PAGE_META 設定 meta 的路徑
const ROUTER_FILE = fileURLToPath(new URL('./src/router/index.js', import.meta.url))
const META_SKIP_PATHS = ['/']
// 預渲染內容要注入的掛載點, 屬性 (v-cloak 等) 原樣保留
const APP_ROOT_RE = /<div id="app"([^>]*)><\/div>/
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
		`<meta property="og:title" content="${title}" />`,
		`<meta property="og:description" content="${description}" />`,
		`<meta property="og:image" content="${og_image}" />`
	].join('\n\t\t')
	return html.replace(/<title>[\s\S]*?<\/title>/, tags)
}

function injectRedirect(html, target) {
	const tags = [
		SITE_URL && `<link rel="canonical" href="${escapeHtml(SITE_URL + target)}" />`,
		`<meta http-equiv="refresh" content="0; url=${escapeHtml(target)}" />`
	].filter(Boolean).join('\n\t\t')
	return html.replace('</head>', `\t${tags}\n\t</head>`)
}

function injectAppContent(html, content) {
	if (!APP_ROOT_RE.test(html)) throw new Error('[page-meta] index.html 找不到 <div id="app"></div>, 無法注入預渲染內容')
	return html.replace(APP_ROOT_RE, (_, attrs) => `<div id="app"${attrs}>${content}</div>`)
}

function renderCourseContent(course) {
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
		'</main>'
	].join('')
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
	const path_list = []
	for (const term_id of term_list) {
		const course_list = (await fetchCourseList(term_id)).course_list || []
		for (const course of course_list) {
			const route_path = courseRoutePath(course.id)
			const html = injectAppContent(injectMeta(base_html, coursePageMeta(course), route_path), renderCourseContent(course))
			const file = resolve(out_dir, `${route_path.slice(1)}.html`)
			mkdirSync(dirname(file), { recursive: true })
			writeFileSync(file, html)
			path_list.push({ path: route_path, year: yearFromCourseId(course.id) })
		}
	}
	console.log(`[page-meta] 共產生 ${path_list.length} 個課程頁面`)
	return path_list
}

function renderRuleContent(year, rule, description) {
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
		'</main>'
	].join('')
}

function fetchRuleList() {
	return fetchJson('/rule/list')
}

function fetchRuleDescription() {
	return fetchJson('/rule/description')
}

async function generateRulePages(base_html, out_dir) {
	const data = await fetchRuleList()
	const description_map = await fetchRuleDescription()
	const rule_map = data.rules || {}
	const dept_map = data.depts || {}
	const path_list = []
	const missing_list = []
	const written = new Set()
	const writeRulePage = (route_path, year, id, rule) => {
		if (written.has(route_path)) return
		written.add(route_path)
		const description = description_map[year]?.[id]
		const description_text = ruleDescriptionText(description)
		if (!description_text) missing_list.push(`${route_path} (${rule.name})`)
		const meta = rulePageMeta(year, rule.name, description_text)
		const html = injectAppContent(injectMeta(base_html, meta, route_path), renderRuleContent(year, rule, description))
		const file = resolve(out_dir, `${route_path.slice(1)}.html`)
		mkdirSync(dirname(file), { recursive: true })
		writeFileSync(file, html)
		path_list.push({ path: route_path, year })
	}
	for (const year of Object.keys(rule_map)) {
		for (const group of deptGroups(dept_map, year)) {
			for (const dept of group.depts) {
				const rule = findSelfRule(rule_map, dept_map, year, dept.id)
				if (!rule) continue
				writeRulePage(ruleRoutePath(year, dept.id, DEFAULT_ID), year, dept.id, rule)
			}
		}
		for (const group of rule_map[year] || []) {
			if (group.group_name === '_') continue
			for (const rule of group.rules) writeRulePage(ruleRoutePath(year, DEFAULT_ID, rule.id), year, rule.id, rule)
		}
	}
	console.log(`[page-meta] 共產生 ${path_list.length} 個畢業學分門檻頁面`)
	if (missing_list.length) console.warn(`[page-meta] ${missing_list.length} 個畢業學分門檻頁面沒有課程類別, 沿用預設 description:\n\t${missing_list.join('\n\t')}`)
	return path_list
}

function latestYearPaths(page_list) {
	const year_list = [...new Set(page_list.map(page => page.year))].sort().slice(-3)
	return page_list.filter(page => year_list.includes(page.year)).map(page => page.path)
}

function generateSitemap(out_dir, path_list) {
	if (!SITE_URL) return console.log('[page-meta] 未指定 BASE_URL, 略過 sitemap.xml')
	const urls = path_list.map(path => `\t<url>\n\t\t<loc>${SITE_URL}${path}</loc>\n\t</url>`).join('\n')
	const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`
	writeFileSync(resolve(out_dir, 'sitemap.xml'), xml)
	console.log(`[page-meta] sitemap.xml 共 ${path_list.length} 個網址`)
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
			writeFileSync(resolve(out_dir, 'index.html'), injectMeta(base_html, DEFAULT_META, '/'))
			for (const [path, meta] of Object.entries(PAGE_META)) {
				const html = injectMeta(base_html, meta, path)
				const file = path === '/' ? resolve(out_dir, 'index.html') : resolve(out_dir, `${path.slice(1)}.html`)
				mkdirSync(dirname(file), { recursive: true })
				writeFileSync(file, html)
			}
			writeFileSync(resolve(out_dir, '404.html'), injectMeta(base_html, DEFAULT_META))
			generateRedirectPages(base_html, out_dir)
			const course_page_list = await generateCoursePages(base_html, out_dir)
			const rule_page_list = await generateRulePages(base_html, out_dir)
			const meta_paths = Object.keys(PAGE_META).filter(path => !SITEMAP_EXCLUDE_PATHS.includes(path))
			generateSitemap(out_dir, ['/', ...meta_paths, ...latestYearPaths(course_page_list), ...latestYearPaths(rule_page_list)])
			checkPageMeta()
		}
	}
}

export default defineConfig({
	plugins: [vue(), tailwindcss(), pageMetaPlugin()],
	envPrefix: ['VITE_', 'API_BASE'],
	define: {
		__BUILD_TIME__: JSON.stringify(BUILD_TIME),
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
