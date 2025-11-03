import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { API_BASE } from "../../helpers/constants";
import { useAuth } from "../../hooks/useAuth";
import "./LoginButton.css";

export default function LoginButton() {
  const { user, login, logout } = useAuth();
  const [loginError, setLoginError] = useState(null);

  const [loginForm, setLoginForm] = useState({
    username: "",
    password: "",
  });

  const [loginFormDisplay, setLoginFormDisplay] = useState(false);

  function closeLoginForm() {
    setLoginForm({
      username: "",
      password: "",
    });
    setLoginFormDisplay(!loginFormDisplay);
  }

  const loginMutation = useMutation({
    mutationFn: async ({ username, password }) => {
      const response = await fetch(`${API_BASE}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        throw new Error("Login failed");
      }
      const json = await response.json();
      return json.user;
    },
    onSuccess: (data) => {
      debugger;
      login(data);
      setLoginError(null);
      closeLoginForm();
    },
    onError: (error) => {
      setLoginError("Error al iniciar sesión");
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await fetch(`${API_BASE}/logout`, {
        method: "POST",
      });
    },
    onSuccess: () => {
      logout();
      closeLoginForm();
    },
  });

  function handleLogin({ username, password }) {
    loginMutation.mutate({ username, password });
  }

  function handleLogout() {
    logoutMutation.mutate();
  }

  return (
    <div id="login-button-container">
      <button onClick={() => setLoginFormDisplay(!loginFormDisplay)}>
        {user?.username || loginError || "Iniciar sesión"}
      </button>
      <div
        id="login-profile-container"
        style={{ display: loginFormDisplay ? "flex" : "none" }}
      >
        {!user ? (
          <div id="login-form">
            <input
              type="text"
              placeholder="Usuario"
              value={loginForm.username}
              onChange={(e) =>
                setLoginForm({
                  ...loginForm,
                  username: e.target.value,
                })
              }
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleLogin(loginForm);
                }
              }}
            />
            <input
              type="password"
              placeholder="Contraseña"
              value={loginForm.password}
              onChange={(e) =>
                setLoginForm({
                  ...loginForm,
                  password: e.target.value,
                })
              }
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleLogin(loginForm);
                }
              }}
            />
          </div>
        ) : (
          <div id="profile-displayer">
            <p>Usuario: {user.username}</p>
            <p>Rol: {user.role}</p>
            <button
              onClick={() => {
                handleLogout();
              }}
            >
              Cerrar sesión
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
