import Login from "./pages/authPages/Login";
import Register from "./pages/authPages/Register";
import Home from "./pages/normalPages/Home";
import { useAppSelector } from "./redux/hooks/hook";
import { Routes, Route } from "react-router-dom";
import { RootState } from "./redux/store";
import ClientDashboard from "./pages/normalPages/ClientDashboard";

function App() {
  const { isAuthenticated } = useAppSelector((state: RootState) => state.user);
  return (
    <>
      <Routes>
        <Route
          path="/"
          element={isAuthenticated ? <ClientDashboard /> : <Home />}
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
