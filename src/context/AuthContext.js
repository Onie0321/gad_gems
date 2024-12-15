"use client";

import React, { createContext, useState, useEffect, useContext } from "react";
import { getAccount, getCurrentUser, signOut } from "@/lib/appwrite";

const AuthContext = createContext(undefined);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const account = await getAccount();
      if (account) {
        const currentUser = await getCurrentUser();
        setUser(currentUser);
      }
    } catch (error) {
      console.error("Error checking user:", error);
      setError("Failed to authenticate user");
      setUser(null); // Ensure user is set to null on error
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    // Implement login logic using Appwrite functions
    // This is a placeholder for the actual implementation
    try {
      // Assuming you have a signIn function in your Appwrite utility
      const account = await signIn(email, password);
      if (account) {
        const currentUser = await getCurrentUser();
        setUser(currentUser);
        setError(null);
      }
    } catch (error) {
      console.error("Login error:", error);
      setError("Failed to log in");
      setUser(null);
    }
  };

  const logout = async () => {
    try {
      await signOut();
      setUser(null);
      setError(null);
    } catch (error) {
      console.error("Error signing out:", error);
      setError("Failed to sign out");
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, error, login, logout, checkUser }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
