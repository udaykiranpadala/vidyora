import { createContext, useContext, useState } from "react";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [organizer, setOrganizer] = useState(() => {
    const saved = localStorage.getItem("organizer");
    return saved ? JSON.parse(saved) : null;
  });

  const login = (organizerData, token) => {
    localStorage.setItem("organizerToken", token);
    localStorage.setItem("organizer", JSON.stringify(organizerData));
    setOrganizer(organizerData);
  };

  const logout = () => {
    localStorage.removeItem("organizerToken");
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
