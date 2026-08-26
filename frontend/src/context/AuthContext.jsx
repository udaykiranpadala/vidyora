import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [organizer, setOrganizer] = useState(() => {
    const saved = localStorage.getItem("organizer");
    return saved ? JSON.parse(saved) : null;
  });

  useEffect(() => {
    const handleAuthExpired = () => {
      logout();
    };
    window.addEventListener("auth:expired", handleAuthExpired);
    return () => window.removeEventListener("auth:expired", handleAuthExpired);
  }, []);

  const login = (organizerData, token, refreshToken) => {
    localStorage.setItem("organizerToken", token);
    if (refreshToken) {
      localStorage.setItem("organizerRefreshToken", refreshToken);
    }
    localStorage.setItem("organizer", JSON.stringify(organizerData));
    setOrganizer(organizerData);
  };

  const logout = () => {
    localStorage.removeItem("organizerToken");
    localStorage.removeItem("organizerRefreshToken");
    localStorage.removeItem("organizer");
    setOrganizer(null);
  };

  const updateOrganizer = (organizerData) => {
    localStorage.setItem("organizer", JSON.stringify(organizerData));
    setOrganizer(organizerData);
  };

  return (
    <AuthContext.Provider value={{ organizer, login, logout, updateOrganizer }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
