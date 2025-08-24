"use client";

import React, { createContext, useState, useEffect, useContext } from "react";
import { 
  auth, 
  getCurrentUser, 
  signIn, 
  signOutUser, 
  onAuthStateChanged 
} from "@/lib/firebase";

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
    // Set up Firebase auth state listener
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const currentUser = await getCurrentUser();
          setUser(currentUser);
          setError(null);
        } catch (error) {
          console.error("Error getting current user:", error);
          setUser(null);
          setError("Failed to get user data");
        }
      } else {
        setUser(null);
        setError(null);
      }
      setLoading(false);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  const login = async (email, password) => {
    try {
      setLoading(true);
      await signIn(email, password);
      // The auth state listener will handle updating the user state
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
      await signOutUser();
      // The auth state listener will handle updating the user state
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