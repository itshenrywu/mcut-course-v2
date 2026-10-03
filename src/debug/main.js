import { createApp } from 'vue'
import { trackFocusModality } from '@/lib/focus-modality'
import '@/assets/index.css'
import DebugApp from '@/debug/DebugApp.vue'

trackFocusModality()
createApp(DebugApp).mount('#app')
