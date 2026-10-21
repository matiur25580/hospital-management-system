import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Patients from './pages/Patients';

function Protected({children}){
  const token=localStorage.getItem('token');
  return token?children:<Navigate to="/" />;
}
export default function App(){
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login/>} />
        <Route path="/patients" element={<Patients/>}/>
      <Route path="/dashboard" element={<Protected><Dashboard/></Protected>} />
      </Routes>
    </BrowserRouter>
  );
}
