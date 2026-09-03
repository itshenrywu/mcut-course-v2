import { migrateLegacyBgImage } from '@/lib/migrate-legacy'
import { trackFocusModality } from '@/lib/focus-modality'
import { createApp } from 'vue'
import '@/assets/index.css'
import App from '@/App.vue'
import router from '@/router'

const mount = () => createApp(App).use(router).mount('#app')

trackFocusModality()
migrateLegacyBgImage().finally(mount)
