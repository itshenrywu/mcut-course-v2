import { migrateLegacyBgImage } from '@/lib/migrate-legacy'
import { createApp } from 'vue'
import '@/assets/index.css'
import App from '@/App.vue'
import router from '@/router'

const mount = () => createApp(App).use(router).mount('#app')

migrateLegacyBgImage().finally(mount)
