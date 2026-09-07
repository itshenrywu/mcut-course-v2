import pluginVue from 'eslint-plugin-vue'

export default [
	{
		ignores: ['dist/**', 'public/**']
	},
	...pluginVue.configs['flat/base'],
	{
		files: ['**/*.vue'],
		rules: {
			// RouterView / RouterLink 由 vue-router 全域註冊, 檔案裡不會有 import
			'vue/no-undef-components': ['error', {
				ignorePatterns: ['RouterView', 'RouterLink']
			}]
		}
	}
]
