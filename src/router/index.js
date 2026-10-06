import { createRouter, createWebHistory, START_LOCATION } from 'vue-router'
import HomeView from '@/views/HomeView.vue'
import { PAGE_META, DEFAULT_META, NOT_FOUND_META } from '@/config/page-meta'
import { courseRoutePath } from '@/lib/course'
import { getRuleList } from '@/api/rule'
import { ruleDocPath } from '@/lib/rule-format'
import { setPageMeta } from '@/lib/meta'
import { sendPageView, logRoutePath } from '@/lib/analytics'
import { startRouteLoading, clearRouteLoading } from '@/lib/route-loading'
import { afterNextPaint } from '@/lib/utils'

const routes = [
	{
		path: '/',
		name: 'home',
		component: HomeView
	},
	{
		path: '/course',
		name: 'course',
		component: () => import('@/views/CourseSearchView.vue')
	},
	{
		path: '/favorite',
		name: 'favorite',
		component: () => import('@/views/FavoriteView.vue')
	},
	{
		path: '/my',
		name: 'my',
		component: () => import('@/views/MyView.vue')
	},
	{
		path: '/more',
		name: 'more',
		component: () => import('@/views/MoreView.vue')
	},
	{
		path: '/login',
		name: 'login',
		component: () => import('@/views/LoginView.vue')
	},
	{
		path: '/about',
		name: 'about',
		component: () => import('@/views/AboutView.vue')
	},
	{
		path: '/changelog',
		name: 'changelog',
		component: () => import('@/views/ChangelogView.vue')
	},
	{
		path: '/contact',
		name: 'contact',
		component: () => import('@/views/ContactView.vue')
	},
	{
		path: '/calendar',
		name: 'calendar',
		component: () => import('@/views/CalendarView.vue')
	},
	{
		path: '/enroll-time',
		name: 'enroll-time',
		component: () => import('@/views/EnrollTimeView.vue')
	},
	{
		path: '/enroll-guide',
		name: 'enroll-guide',
		component: () => import('@/views/EnrollGuideView.vue')
	},
	{
		path: '/english-exam',
		name: 'english-exam',
		component: () => import('@/views/EnglishExamView.vue')
	},
	{
		path: '/english-passport',
		name: 'english-passport',
		component: () => import('@/views/EnglishPassportView.vue')
	},
	{
		path: '/goal-course-route',
		name: 'goal-course-route',
		component: () => import('@/views/GoalCourseRouteView.vue')
	},
	{
		path: '/rule/doc/:doc_id',
		component: () => import('@/views/RuleView.vue'),
		beforeEnter: async to => {
			try {
				const { rules, depts } = await getRuleList()
				return ruleDocPath(rules || {}, depts || {}, to.params.doc_id) || { name: 'not-found', params: { pathMatch: to.path.slice(1).split('/') } }
			} catch {
				return '/rule'
			}
		}
	},
	{
		path: '/rule/:year?/:dept_id?/:rule_id?',
		name: 'rule',
		component: () => import('@/views/RuleView.vue')
	},
	{
		path: '/course/:id',
		redirect: to => to.params.id.length > 4
			? courseRoutePath(to.params.id)
			: { name: 'not-found', params: { pathMatch: to.path.slice(1).split('/') } }
	},
	{
		path: '/course/:short_term_id/:course_no',
		name: 'course-detail',
		component: () => import('@/views/CourseDetailView.vue')
	},

	// 舊版兼容
	{
		path: '/course/:short_term_id/:course_no1/:course_no2',
		redirect: to => courseRoutePath(to.params.short_term_id + to.params.course_no1 + to.params.course_no2)
	},
	{
		path: '/saved',
		redirect: '/favorite'
	},
	{
		path: '/info',
		redirect: '/enroll-time'
	},
	{
		path: '/exam',
		redirect: '/english-exam'
	},
	{
		path: '/road',
		redirect: '/goal-course-route'
	},
	{
		path: '/guide',
		redirect: '/enroll-guide'
	},
	{
		path: '/passport',
		redirect: '/english-passport'
	},

	// 404
	{
		path: '/:pathMatch(.*)*',
		name: 'not-found',
		component: () => import('@/views/NotFoundView.vue')
	}
]

const router = createRouter({
	history: createWebHistory(),
	routes
})

router.beforeEach((to, from) => {
	if (from === START_LOCATION) return
	const need_load = to.matched.some(record => typeof record.components?.default === 'function')
	startRouteLoading(need_load)
})

// 換頁會在同一個 task 同步掛載新頁面, 先讓點擊畫出一幀, 重的渲染才不會算進 INP; 同一路由只換參數不用等
router.beforeResolve((to, from) => {
	if (from === START_LOCATION || to.name === from.name) return
	return afterNextPaint()
})

router.afterEach((to) => {
	clearRouteLoading()
	logRoutePath(to.path)
	if (to.name === 'course-detail' || to.name === 'rule') return
	const meta = to.name === 'not-found' ? NOT_FOUND_META : (PAGE_META[to.path] || DEFAULT_META)
	setPageMeta(meta)
	sendPageView(to.fullPath)
})

router.onError((error, to) => {
	clearRouteLoading()
	if (/dynamically imported module|Importing a module script failed/.test(error?.message || '')) {
		const path = to.fullPath.startsWith('/') && !to.fullPath.startsWith('//') ? to.fullPath : '/'
		location.assign(path)
	}
})

export default router
