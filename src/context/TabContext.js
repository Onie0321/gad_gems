"use client";

import { createContext, useContext } from 'react';

const TabContext = createContext(undefined);

export function useTabContext() {
  const context = useContext(TabContext);
  if (context === undefined) {
    throw new Error('useTabContext must be used within a TabProvider');
  }
  return context;
}

export function TabProvider({ children, value }) {
  if (!value) {
    throw new Error('TabProvider requires a value prop');
  }
  
  return (
    <TabContext.Provider value={value}>
      {children}
    </TabContext.Provider>
  );
}