import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type UserType = "Lawyer" | "Client" | null;

interface AuthContextType {
  isAuthenticated: boolean;
  userPrincipal: string | null;
  userType: UserType;
  login: (principal: string) => void;
  logout: () => void;
  setUserType: (type: UserType) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userPrincipal, setUserPrincipal] = useState<string | null>(null);
  const [userType, setUserTypeState] = useState<UserType>(null);

  useEffect(() => {
    const savedPrincipal = localStorage.getItem("userPrincipal");
    const savedUserType = localStorage.getItem("userType") as UserType;
    
    if (savedPrincipal && savedUserType) {
      setUserPrincipal(savedPrincipal);
      setUserTypeState(savedUserType);
      setIsAuthenticated(true);
    }
  }, []);

  const login = (principal: string) => {
    setUserPrincipal(principal);
    setIsAuthenticated(true);
    localStorage.setItem("userPrincipal", principal);
  };

  const logout = () => {
    setUserPrincipal(null);
    setUserTypeState(null);
    setIsAuthenticated(false);
    localStorage.removeItem("userPrincipal");
    localStorage.removeItem("userType");
  };

  const setUserType = (type: UserType) => {
    setUserTypeState(type);
    if (type) {
      localStorage.setItem("userType", type);
    }
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, userPrincipal, userType, login, logout, setUserType }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
