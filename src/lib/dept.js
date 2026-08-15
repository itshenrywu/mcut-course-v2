// 額外歸入「四技日間部」的系所 (名稱不含「四技...系」但屬日間部)
const DEPT_GROUP_EXTRA = ['人工智慧學程', '環實務', '電池專班', '半導體學程', '行銷設計學程', '四技行設專班']

export function isDayBachelorDept(dept) {
	return (dept.includes('四技') && dept.includes('系')) || DEPT_GROUP_EXTRA.includes(dept)
}