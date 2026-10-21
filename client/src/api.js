import axios from 'axios';
const api = axios.create({ baseURL: 'https://fluffy-potato-xgq7p7557rrhpwrp-5000.app.github.dev/api' });
api.interceptors.request.use(c=>{ const t=localStorage.getItem('token'); if(t) c.headers.Authorization=`Bearer ${t}`; return c; });
export default api;
