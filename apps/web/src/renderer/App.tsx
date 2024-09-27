import { MemoryRouter as Router, Routes, Route } from 'react-router-dom';
import 'tailwindcss/tailwind.css';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Home from './pages/normal/Home';
import { useAppSelector } from './redux/hooks/hook';
import Landing from './pages/normal/Landing';
import Users from './pages/normal/Users';

function Hello() {
  return (
    <div className="bg-white w-full min-h-screen">
      <Home />
    </div>
  );
}

export default function App() {
  const { isAuthenticated } = useAppSelector((state) => state.user);
  return (
    <Router>
      <Routes>
        <Route path="/" element={!isAuthenticated ? <Hello /> : <Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/users" element={<Users />} />
      </Routes>
    </Router>
  );
}
