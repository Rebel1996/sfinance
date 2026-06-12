import { createContext, useContext, useState } from 'react';

const UserContext = createContext(null);

export function UserProvider({ children, initialUser, onLogout }) {
  const [user, setUser] = useState(initialUser);

  return (
    <UserContext.Provider value={{ user, setUser, onLogout }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error('useUser must be used inside UserProvider');
  return ctx;
}
