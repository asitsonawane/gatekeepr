import { useState, useEffect } from 'react';
import { Login } from './components/Login';
import { Dashboard } from './components/Dashboard';
import { SetupWizard } from './components/SetupWizard';
import { User } from './lib/types';
import { checkSetupRequired } from './lib/api';
import { Loader2 } from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isSetupRequired, setIsSetupRequired] = useState<boolean | null>(null);
  const [checkingSetup, setCheckingSetup] = useState(true);

  useEffect(() => {
    checkSetupRequired().then((required) => {
      setIsSetupRequired(required);
      setCheckingSetup(false);
    });
  }, []);

  const handleLogin = (email: string) => {
    // Phase 4: We will actually fetch the user details from /me here.
    // For now, reconstruct the user object to match what login() returns locally
    // or fallback to mock if needed for visual testing.
    const user: User = {
      id: '1',
      name: email.split('@')[0],
      email: email,
      role: email.includes('admin') ? 'admin' : 'user',
      avatar: `https://ui-avatars.com/api/?name=${email}&background=random`
    };
    setCurrentUser(user);
  };

  const handleSetupComplete = (token: string, email: string) => {
    localStorage.setItem('token', token);
    handleLogin(email);
    setIsSetupRequired(false);
  };

  if (checkingSetup) {
    return (
      <div className="h-screen w-full flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (isSetupRequired) {
    return <SetupWizard onSetupComplete={handleSetupComplete} />;
  }

  if (!currentUser) {
    return <Login onLogin={handleLogin} />;
  }

  return <Dashboard currentUser={currentUser} onLogout={() => setCurrentUser(null)} />;
}
