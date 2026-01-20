import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { ShieldAlert } from 'lucide-react';
import { setupAdmin } from '../lib/api';
import { toast } from 'sonner';

interface SetupWizardProps {
    onSetupComplete: (token: string, email: string) => void;
}

export function SetupWizard({ onSetupComplete }: SetupWizardProps) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email || !password) return;

        if (password !== confirmPassword) {
            toast.error('Passwords do not match');
            return;
        }

        if (password.length < 8) {
            toast.error('Password must be at least 8 characters');
            return;
        }

        setLoading(true);
        try {
            const { token, roles } = await setupAdmin(email, password);
            localStorage.setItem('token', token);
            localStorage.setItem('roles', JSON.stringify(roles || ['super_admin']));
            toast.success('System initialized successfully!');
            onSetupComplete(token, email);
        } catch (error: any) {
            toast.error('Setup failed: ' + (error.message || 'Unknown error'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-background px-4">
            <div className="w-full max-w-md">
                <div className="flex flex-col items-center mb-8">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2.5 bg-primary rounded-lg">
                            <ShieldAlert className="w-7 h-7 text-primary-foreground" />
                        </div>
                        <h1 className="text-3xl">GateKeepr Setup</h1>
                    </div>
                    <p className="text-muted-foreground text-center">
                        Welcome! Create your Super Admin account to get started.
                    </p>
                </div>

                <Card className="border shadow-sm">
                    <CardHeader className="space-y-1">
                        <CardTitle className="text-2xl">Create Admin</CardTitle>
                        <CardDescription>
                            This user will have full access to the system.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="email">Admin Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="admin@company.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="password">Password</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="Minimum 8 characters"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    minLength={8}
                                />
                                <p className="text-xs text-muted-foreground">
                                    Must be at least 8 characters long.
                                </p>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="confirmPassword">Confirm Password</Label>
                                <Input
                                    id="confirmPassword"
                                    type="password"
                                    placeholder="Re-enter password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                    minLength={8}
                                />
                            </div>
                            <Button type="submit" className="w-full" disabled={loading}>
                                {loading ? 'Initializing System...' : 'Sign Up'}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
