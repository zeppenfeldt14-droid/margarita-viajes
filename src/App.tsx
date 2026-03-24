import { useState, useEffect } from "react";
import { Route, Switch, useLocation, Redirect } from "wouter";
import { GlobalProvider } from "./context/GlobalContext";
import AdminDashboard from "./pages/Admin";
import Login from "./pages/Login";
import Quoter from "./pages/Quoter";
import Home from "./pages/Home";

import AdminLayout from "./layouts/AdminLayout";

function App() {
  const [_, setLocation] = useLocation();
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem("staff_auth") === "true";
  });
  const [user, setUser] = useState(() => {
    return localStorage.getItem("staff_user") || "";
  });

  useEffect(() => {
    const auth = localStorage.getItem("staff_token");
    console.log("[App] Checked localStorage for staff_token:", !!auth);
    setIsAuthenticated(!!auth);
  }, []);

  const handleLogin = (staffUser: string) => {
    setIsAuthenticated(true);
    setUser(staffUser);
    setLocation("/admin");
  };

  const handleLogout = () => {
    localStorage.removeItem("staff_auth");
    localStorage.removeItem("staff_user");
    localStorage.removeItem("staff_user_id");
    localStorage.removeItem("staff_user_email");
    localStorage.removeItem("staff_user_alias");
    localStorage.removeItem("user_level");
    localStorage.removeItem("user_modules");
    localStorage.removeItem("staff_token"); 
    setIsAuthenticated(false);
    setUser("");
    setLocation("/");
  };

  return (
    <GlobalProvider>
      <div className="min-h-screen bg-[#F8F9FA]">
        <Switch>
          <Route path="/cotizador">
            <Quoter />
          </Route>

          <Route path="/login">
            {() => {
              console.log("[App] Rendering /login, isAuthenticated:", isAuthenticated);
              return isAuthenticated ? <Redirect to="/admin" /> : <Login onLogin={handleLogin} onBack={() => setLocation("/")} />;
            }}
          </Route>

          {["/admin", "/admin/inventory", "/admin/quotes", "/admin/reservations", "/admin/sales", "/admin/users", "/admin/customers", "/admin/marketing", "/admin/administration", "/admin/webconfig"].map(path => (
            <Route key={path} path={path}>
              {() => {
                console.log("[App] Navigating to admin route:", path, "Auth:", isAuthenticated);
                return isAuthenticated ? (
                  <AdminLayout onLogout={handleLogout}>
                    <AdminDashboard user={user} />
                  </AdminLayout>
                ) : (
                  <Redirect to="/login" />
                );
              }}
            </Route>
          ))}

          <Route path="/">
            <Home onAdminClick={() => setLocation("/login")} />
          </Route>

          {/* Default fallback */}
          <Route>
            {() => {
              console.log("[App] Fallback route triggered, redirecting to /");
              return <Redirect to="/" />;
            }}
          </Route>
        </Switch>
      </div>
    </GlobalProvider>
  );
}

export default App;
