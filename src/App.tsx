import { useState } from "react";
import { Route, Switch, useLocation } from "wouter";
import { GlobalProvider } from "./context/GlobalContext";
import Home from "./pages/Home";
import AdminDashboard from "./pages/Admin";
import Login from "./pages/Login";
import Quoter from "./pages/Quoter";

function App() {
  const [, setLocation] = useLocation();
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem("staff_auth") === "true";
  });
  const [user, setUser] = useState(() => {
    return localStorage.getItem("staff_user") || "";
  });

  const handleLogin = (staffUser: string) => {
    setIsAuthenticated(true);
    setUser(staffUser);
    localStorage.setItem("staff_auth", "true");
    localStorage.setItem("staff_user", staffUser);
    setLocation("/admin");
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUser("");
    localStorage.removeItem("staff_auth");
    localStorage.removeItem("staff_user");
    localStorage.removeItem("staff_token"); // Limpiar también el token
    setLocation("/");
  };

  return (
    <GlobalProvider>
      <Switch>
        <Route path="/">
          <Home onAdminClick={() => setLocation(isAuthenticated ? "/admin" : "/login")} />
        </Route>
        <Route path="/login">
          <Login onLogin={handleLogin} onBack={() => setLocation("/")} />
        </Route>
        <Route path="/admin">
          {isAuthenticated ? <AdminDashboard user={user} onLogout={handleLogout} /> : <Login onLogin={handleLogin} onBack={() => setLocation("/")} />}
        </Route>
        <Route path="/cotizador">
          <Quoter />
        </Route>
      </Switch>
    </GlobalProvider>
  );
}

export default App;
