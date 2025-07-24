"use client";

import React, { createContext, useState, useEffect, useContext } from "react";
import {
  account,
  databases,
  getCurrentUser,
  SignOut,
  hasValidSession,
} from "@/lib/appwrite";

// Create AuthContext with initial values
const AuthContext = createContext({
  user: null,
  loading: true,
  error: null,
  login: () => Promise.resolve(),
  logout: () => Promise.resolve(),
  checkUser: () => Promise.resolve(),
});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const checkUser = async () => {
    try {
      // Check for existing session in localStorage first
      const hasSession = localStorage.getItem("session");
      if (!hasSession) {
        console.log("No session found in localStorage");
        setUser(null);
        setError(null);
        setLoading(false);
        return;
      }

      // Check if a valid Appwrite session exists before calling getCurrentUser
      const validSession = await hasValidSession();
      if (!validSession) {
        setUser(null);
        setError(null);
        setLoading(false);
        return;
      }

      // Only try to get current user if we have a session
      const currentUser = await getCurrentUser();
      if (currentUser) {
        setUser(currentUser);
        setError(null);
      } else {
        // If no current user but we have a session, clear the session
        localStorage.removeItem("session");
        localStorage.removeItem("userRole");
        setUser(null);
        setError(null);
      }
    } catch (error) {
      console.error("Error checking user:", error);
      // Clear session if there's an error
      localStorage.removeItem("session");
      localStorage.removeItem("userRole");
      setUser(null);
      setError(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkUser();
  }, []);

  const login = async (email, password) => {
    try {
      setLoading(true);
      const session = await account.createEmailSession(email, password);
      // Store session indicator in localStorage
      localStorage.setItem("session", "true");
      await checkUser(); // Refresh user data after login
      return true;
    } catch (error) {
      console.error("Login error:", error);
      setError("Failed to log in");
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setLoading(true);
      // Clear session from localStorage
      localStorage.removeItem("session");
      localStorage.removeItem("userRole");
      setUser(null);
      setError(null);
    } catch (error) {
      console.error("Error signing out:", error);
      setError("Failed to sign out");
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
    loading,
    error,
    login,
    logout,
    checkUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
