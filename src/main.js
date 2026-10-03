import { migrateLegacyBgImage } from '@/lib/migrate-legacy'
import { trackFocusModality } from '@/lib/focus-modality'
import { trackInp } from '@/lib/analytics'
import { createApp } from 'vue'
import '@/assets/index.css'
import App from '@/App.vue'
import router from '@/router'

const mount = () => createApp(App).use(router).mount('#app')

trackFocusModality()
trackInp()
// /debug 刪除資料後會通知, 重新載入才不會把記憶體裡的舊資料寫回去
if (window.BroadcastChannel) new BroadcastChannel('mcv2-debug').onmessage = () => location.reload()
migrateLegacyBgImage().finally(mount)
