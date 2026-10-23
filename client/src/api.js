import axios from 'axios';
const api = axios.create({ baseURL: 'http://localhost:5000/api' });
api.interceptors.request.use(c=>{ const t=sessionStorage.getItem('hms_token')||sessionStorage.getItem('token')||sessionStorage.getItem('token'); if(t) c.headers.Authorization=`Bearer ${t}`; return c; });
export default api;
