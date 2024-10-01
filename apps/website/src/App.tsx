import Login from "./pages/authPages/Login";
import Register from "./pages/authPages/Register";
import AuthenticatedHome from "./pages/normalPages/AuthenticatedHome";
import Home from "./pages/normalPages/Home";
import { useAppSelector } from "./redux/hooks/hook";
import { Routes, Route } from "react-router-dom";

function App() {
  const { isAuthenticated } = useAppSelector((state) => state.user);
  return (
    <>
      <Routes>
        <Route
          path="/"
          element={isAuthenticated ? <AuthenticatedHome /> : <Home />}
        />
        <Route
          path="/login"
          element={<Login />} 
        />
        <Route
          path="/register"
          element={<Register />} 
        />
      </Routes>
    </>
  );
}

export default App;
