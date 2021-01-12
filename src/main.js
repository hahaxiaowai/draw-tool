import Vue from 'vue'
import App from './App.vue'
import { Button, Icon,message } from 'ant-design-vue';
import 'ant-design-vue/dist/antd.css';
Vue.config.productionTip = false
Vue.use(Button);
Vue.use(Icon);
Vue.prototype.$message =message;
new Vue({
  render: h => h(App),
}).$mount('#app')
