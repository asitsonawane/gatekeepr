import { useState } from 'react';
import { Login } from './components/Login';
import { Dashboard } from './components/Dashboard';
import { mockUsers } from './lib/mockData';
import { User } from './lib/types';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const handleLogin = (email: string) => {
    // Find user by email or use first user as default
    const user = mockUsers.find((u) => u.email === email) || mockUsers[0];
    setCurrentUser(user);
  };

  if (!currentUser) {
    return <Login onLogin={handleLogin} />;
  }

  return <Dashboard currentUser={currentUser} onLogout={() => setCurrentUser(null)} />;
}
