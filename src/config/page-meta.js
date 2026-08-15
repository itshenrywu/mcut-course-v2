import { courseSummaryParts } from '../lib/course-format.js'
import { yearFromCourseId, termFromCourseId, termIdFromCourseId, formatTermLabel } from '../lib/term-format.js'

const SITE_NAME = '明志科技大學選課小幫手'

export const DEFAULT_META = {
	title: SITE_NAME,
	description: '明志科技大學選課小幫手，幫助您輕鬆查詢全校課表，快速進行課程預排與衝堂檢查，還可以查詢畢業學分門檻！'
}

export const NOT_FOUND_META = {
	title: `404 找不到此頁面 | ${SITE_NAME}`,
	description: DEFAULT_META.description
}

export const PAGE_META = {
	'/course': {
		title: `進階搜尋 | ${SITE_NAME}`,
		description: '可搜尋課程名稱 / 老師 / 課程代碼，也可依課程類別、學分數、上課時間、上課地點等條件進行篩選'
	},
	'/favorite': {
		title: `收藏的課程 | ${SITE_NAME}`,
		description: '檢視收藏的課程，可切換列表或課表檢視，並檢查收藏課程之間是否衝堂'
	},
	'/my': {
		title: `我的課表 | ${SITE_NAME}`,
		description: '自己安排一份專屬課表，可自由新增課程名稱、星期、節次與備註，並下載成課表圖片！'
	},
	'/rule': {
		title: `畢業學分門檻 | ${SITE_NAME}`,
		description: '依入學學年度與系所查詢各系所畢業學分門檻，以及第二專長、跨領域學程的總表、開設單位與承辦人聯絡方式'
	},
	'/more': {
		title: `更多功能 | ${SITE_NAME}`,
		description: '行事曆、英文段考時間與考場、學餐菜單、校園路跑成績等其他查詢功能，以及選課指南與本站說明'
	},
	'/about': {
		title: `關於本站 | ${SITE_NAME}`,
		description: '明志科技大學選課小幫手的開發者介紹、資料來源及免責聲明'
	},
	'/changelog': {
		title: `更新紀錄 | ${SITE_NAME}`,
		description: '明志科技大學選課小幫手歷年的功能改善與問題修正紀錄'
	},
	'/contact': {
		title: `建議及問題回報 | ${SITE_NAME}`,
		description: '使用上遇到問題或有功能建議，歡迎透過 LINE 或 Instagram 與我聯繫，或在 GitHub 上提出 Issue'
	},
	'/calendar': {
		title: `行事曆 | ${SITE_NAME}`,
		description: '以月曆或清單檢視校內行事曆、社團活動行事曆與體育室場地借用的時間、地點，並可依分類篩選要顯示的活動'
	},
	'/enroll-time': {
		title: `選課時間及說明 | ${SITE_NAME}`,
		description: '各學制年級的網路初選、加退選時間與選課學分上下限，以及選課注意事項與相關聯絡電話'
	},
	'/enroll-guide': {
		title: `選課指南 | ${SITE_NAME}`,
		description: '畢業門檻、大學之道與設計思考等課程簡介，以及選課系統的操作說明與注意事項'
	},
	'/english-exam': {
		title: `英文段考時間與考場 | ${SITE_NAME}`,
		description: '查詢大一、大二英文段考的考試時間、班級、授課老師與考場地點'
	},
	'/english-passport': {
		title: `英語學習護照點數查詢 | ${SITE_NAME}`,
		description: '輸入學號查詢英語學習護照的總計點數，以及 English Corner、Lunch English、外語學習講座、Oral Clinic 等各項活動已獲得的點數'
	},
	'/goal-course-route': {
		title: `大學之道「環境與行動」路線查詢 | ${SITE_NAME}`,
		description: '輸入學號查詢大學之道「環境與行動」的實作踏查路線編號，以及前導課、實作踏查與課後討論的上課時段'
	},
	'/login': {
		title: `登入中 | ${SITE_NAME}`,
		description: DEFAULT_META.description
	},
}

// 會產生實體頁面但不寫進 sitemap 的路徑
export const SITEMAP_EXCLUDE_PATHS = ['/login']

export function rulePageMeta(year, name, description = '') {
	if (!year || !name) return PAGE_META['/rule']
	return {
		title: `${year} 學年入學 - ${name} | ${SITE_NAME}`,
		description: description || `${year} 學年入學 ${name} 的應修學分與畢業學分門檻，包含修課指引、備註與承辦人聯絡方式`
	}
}

export function coursePageMeta(course) {
	const summary = courseSummaryParts(course)
	const parts = [summary.dept_class, summary.teacher, summary.credit, summary.general_type, summary.remark].filter(Boolean)
	return {
		title: `${yearFromCourseId(course.id)}-${termFromCourseId(course.id)} ${course.name} | ${SITE_NAME}`,
		description: `${formatTermLabel(termIdFromCourseId(course.id))}・${parts.join('・')}`
	}
}
