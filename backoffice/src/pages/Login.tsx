import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

const Login: React.FC = () => {
    const navigate = useNavigate();
    const { login } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    // Unified credentials - can be either websiteId/email and appId/password
    const [identifier, setIdentifier] = useState('');
    const [secret, setSecret] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            // Determine if identifier is email or websiteId
            const isEmail = identifier.includes('@');

            if (isEmail) {
                // Super admin login
                await login({ email: identifier, password: secret });
                navigate('/admin');
            } else {
                // Koru client login
                await login({ websiteId: identifier, appId: secret });
                navigate('/dashboard');
            }
        } catch (err: any) {
            setError(err.message || 'Login failed');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-muted/50 p-4">
            <Card className="w-full max-w-md shadow-lg">
                <CardHeader className="space-y-1 text-center">
                    <CardTitle className="text-2xl font-bold">Koru Booking</CardTitle>
                    <CardDescription>
                        Enter your credentials to access the backoffice
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="identifier">Website ID / Email</Label>
                            <Input
                                id="identifier"
                                type="text"
                                value={identifier}
                                onChange={(e) => setIdentifier(e.target.value)}
                                placeholder="name@example.com or Website ID"
                                required
                                disabled={isLoading}
                                autoComplete="username"
                            />
                            <p className="text-xs text-muted-foreground">
                                Clients: use Website ID | Administrators: use Email
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="secret">App ID / Password</Label>
                            <Input
                                id="secret"
                                type="password"
                                value={secret}
                                onChange={(e) => setSecret(e.target.value)}
                                placeholder="••••••••"
                                required
                                disabled={isLoading}
                                autoComplete="current-password"
                            />
                            <p className="text-xs text-muted-foreground">
                                Clients: use App ID | Administrators: use Password
                            </p>
                        </div>

                        {error && (
                            <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-md">
                                {error}
                            </div>
                        )}

                        <Button
                            type="submit"
                            className="w-full"
                            disabled={isLoading}
                        >
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {isLoading ? 'Logging in...' : 'Login'}
                        </Button>
                    </form>
                </CardContent>
                <CardFooter className="flex justify-center border-t p-4 mt-2">
                    <p className="text-xs text-muted-foreground">
                        Protected System. Authorized Access Only.
                    </p>
                </CardFooter>
            </Card>
        </div>
    );
};

export default Login;
