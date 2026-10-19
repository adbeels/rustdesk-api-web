import { createApp } from 'vue'
import 'element-plus/dist/index.css'
import App from './App.vue'
import ElementPlus from 'element-plus'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import { router } from '@/router'
import 'normalize.css/normalize.css'
import { pinia } from '@/store'
import '@/permission'
import 'element-plus/theme-chalk/dark/css-vars.css'
import '@/styles/style.scss'
import {
  ArrowDown, ChatRound, Collection, CollectionTag, Expand, Files, Fold, House, Link, List,
  Monitor, Notebook, Setting, Ticket, Tickets, Tools, User, UserFilled,
} from '@element-plus/icons-vue'

// Iconos que se usan por nombre (<el-icon-xxx> y meta.icon del menú en src/router). Antes se registraban
// los 293 del paquete (~240 kB). Si una ruta nueva usa otro icono, agrégalo aquí.
const ElementIcons = {
  ArrowDown, ChatRound, Collection, CollectionTag, Expand, Files, Fold, House, Link, List,
  Monitor, Notebook, Setting, Ticket, Tickets, Tools, User, UserFilled,
}

const app = createApp(App)
app.use(ElementPlus, { locale: zhCn })
app.use(pinia)
app.use(router)
for (let icon in ElementIcons){
  app.component("ElIcon" +icon ,ElementIcons[icon])
}
app.mount('#app')
