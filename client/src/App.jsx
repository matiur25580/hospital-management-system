import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Patients from './pages/Patients';
import Appointments from './pages/Appointments';
import Beds from './pages/Beds';

function Protected({children}){
  const token=sessionStorage.getItem('token');
  return token?children:<Navigate to="/" />;
}
export default function App(){
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={sessionStorage.getItem("token")?<Navigate to="/dashboard"/>:<Login/>} />
        <Route path="/beds" element={<Protected><Beds/></Protected>}/>
      <Route path="/appointments" element={<Protected><Appointments/></Protected>}/>
      <Route path="/patients" element={<Protected><Patients/></Protected>}/>
      <Route path="/dashboard" element={<Protected><Dashboard/></Protected>} />
      </Routes>
    </BrowserRouter>
  );
}
