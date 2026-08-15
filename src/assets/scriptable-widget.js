const COLOR = __COLOR__
const TIMETABLE = __DATA__
const PAGE_URL = 'https://mcut-course.com/my/'

function toMinutes(text) {
	const [hour, minute] = text.split(':')
	return Number(hour) * 60 + Number(minute)
}

function findCourse() {
	const now = new Date()
	const minutes = now.getHours() * 60 + now.getMinutes()
	const list = TIMETABLE[now.getDay()] || []
	const course = list.find(item => toMinutes(item.e) > minutes)
	if (!course) return null
	return { ...course, started: toMinutes(course.s) <= minutes }
}

function addText(widget, text, font, color, opacity) {
	const element = widget.addText(text)
	element.font = font
	element.textColor = color
	if (opacity) element.textOpacity = opacity
	return element
}

function createWidget() {
	const widget = new ListWidget()
	const gradient = new LinearGradient()
	gradient.locations = [0, 1]
	gradient.colors = [new Color(COLOR[0]), new Color(COLOR[1])]
	widget.backgroundGradient = gradient
	widget.backgroundColor = new Color(COLOR[0])
	widget.url = PAGE_URL
	const color = new Color(COLOR[2])
	const course = findCourse()
	if (!course) {
		addText(widget, '今天沒有課了！', Font.boldSystemFont(18), color)
		return widget
	}
	const compact = config.widgetFamily === 'accessoryRectangular'
	const time = `${course.s} ~ ${course.e}`
	addText(widget, course.started ? '上課中' : '下一堂課', Font.mediumSystemFont(compact ? 10 : 12), color, 0.9)
	widget.addSpacer(compact ? 2 : 8)
	addText(widget, course.n, Font.boldSystemFont(compact ? 14 : 16), color)
	if (compact) {
		addText(widget, course.r ? `${time} / ${course.r}` : time, Font.systemFont(10), color)
		return widget
	}
	widget.addSpacer(4)
	addText(widget, time, Font.systemFont(14), color)
	if (course.r) addText(widget, course.r, Font.systemFont(14), color, 0.9)
	return widget
}

const widget = createWidget()
if (config.runsInWidget) Script.setWidget(widget)
else widget.presentMedium()
Script.complete()
