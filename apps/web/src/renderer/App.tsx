import { MemoryRouter as Router, Routes, Route } from 'react-router-dom';
import 'tailwindcss/tailwind.css';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Home from './pages/normal/Home';

function Hello() {
  return (
    <div className="bg-white w-full min-h-screen">
      <Home />
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Hello />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Routes>
    </Router>
  );
}
