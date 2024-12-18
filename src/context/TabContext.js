import { createContext, useContext } from 'react';

const TabContext = createContext();

export function useTabContext() {
  const context = useContext(TabContext);
  if (!context) {
    throw new Error('useTabContext must be used within a TabProvider');
  }
  return context;
}

export function TabProvider({ children, value }) {
  return (
    <TabContext.Provider value={value}>
      {children}
    </TabContext.Provider>
  );
}