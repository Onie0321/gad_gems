"use client";

import React, { createContext, useState, useEffect, useContext } from "react";
import { account, databases, getCurrentUser, SignOut } from "@/lib/appwrite";

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
      const currentUser = await getCurrentUser();
      setUser(currentUser);
      setError(null);
    } catch (error) {
      console.error("Error checking user:", error);
      setError("Failed to authenticate user");
      setUser(null);
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
      await account.createEmailSession(email, password);
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
      await account.deleteSession("current");
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

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};