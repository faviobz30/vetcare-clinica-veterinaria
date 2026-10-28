import RecuperarContrasena from './pages/RecuperarContrasena'
import RestablecerContrasena from './pages/RestablecerContrasena'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import Login from './pages/Login'
import Home from './pages/Home'
import Citas from './pages/Citas'
import Atenciones from './pages/Atenciones'
import HistoriaClinica from './pages/HistoriaClinica'
import Shell from './components/Shell'
import ResourcePage from './components/ResourcePage'
import Inicio from './pages/Inicio'
import Registro from './pages/Registro'
import Perfil from './pages/Perfil'
import Mascotas from './pages/Mascotas'
import Propietarios from './pages/Propietarios'
import Usuarios from './pages/Usuarios'
import Veterinarios from './pages/Veterinarios'
import Vacunas from './pages/Vacunas'
import MisPublicaciones from './pages/MisPublicaciones'

function Protected({children}){const {user}=useAuth();return user?children:<Navigate to="/login" replace/>}
function RoleRoute({roles,children}){const {user}=useAuth();return user&&roles.includes(user.role)?children:<Navigate to="/panel" replace/>}
function LoginRoute(){const {user}=useAuth();return user?<Navigate to="/panel" replace/>:<Login/>}
export default function App(){return <BrowserRouter><AuthProvider><Routes>
<Route path="/" element={<Inicio />} />
<Route path="/recuperar-contrasena" element={<RecuperarContrasena/>}/><Route path="/restablecer-contrasena" element={<RestablecerContrasena/>}/>
<Route path="/login" element={<LoginRoute/>}/><Route path="/registro" element={<Registro/>}/>
<Route path="/panel" element={<Protected><Shell/></Protected>}>
<Route index element={<Home/>}/>
<Route path="citas" element={<Citas/>}/>
<Route path="mascotas" element={<Mascotas/>}/>
<Route path="veterinarios" element={<Veterinarios/>}/>
<Route path="perfil" element={<Perfil/>}/>
<Route path="atenciones" element={<Atenciones/>}/>
<Route path="vacunas" element={<Vacunas/>}/>

<Route
  path="mis-historias"
  element={
    <RoleRoute roles={['PROPIETARIO']}>
      <MisPublicaciones />
    </RoleRoute>
  }
/>

<Route path="historias" element={<HistoriaClinica/>}/>
<Route path="propietarios" element={<RoleRoute roles={['ADMIN']}><Propietarios/></RoleRoute>}/>
<Route path="usuarios" element={<RoleRoute roles={['ADMIN']}><Usuarios/></RoleRoute>}/>
</Route><Route path="*" element={<Navigate to="/panel" replace/>}/></Routes></AuthProvider></BrowserRouter>}
