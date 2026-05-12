import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { startOauthFlow } from '../lib/oauth-pkce';

const KORU_URL = import.meta.env.VITE_KORU_URL as string | undefined;
const KORU_APP_ID = import.meta.env.VITE_KORU_APP_ID as string | undefined;

const Login: React.FC = () => {
    const navigate = useNavigate();
    const { koruLogin, user, isAdmin } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [redirecting, setRedirecting] = useState(false);
    const [error, setError] = useState('');

    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    const oauthConfigured = Boolean(KORU_URL && KORU_APP_ID);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            // All users (admins and clients) login with username/password
            await koruLogin({ username, password });

            // Navigation will happen in useEffect after auth state updates
        } catch (err: any) {
            setError(err.message || 'Invalid credentials');
        } finally {
            setIsLoading(false);
        }
    };

    const startGoogleFlow = async () => {
        if (!oauthConfigured) {
            setError('Login con KoruSuite aún no está configurado');
            return;
        }
        setError('');
        setRedirecting(true);
        try {
            const { state, codeChallenge } = await startOauthFlow();
            const redirectUri = `${window.location.origin}/auth/callback`;
            const params = new URLSearchParams({
                app_id: KORU_APP_ID!,
                redirect_uri: redirectUri,
                state,
                code_challenge: codeChallenge,
                code_challenge_method: 'S256',
            });
            window.location.href = `${KORU_URL}/api/auth/authorize?${params.toString()}`;
        } catch (err) {
            console.error('[login] oauth start failed', err);
            setError('No se pudo iniciar el login con KoruSuite');
            setRedirecting(false);
        }
    };

    // Navigate after successful login based on role
    React.useEffect(() => {
        if (user && !isLoading) {
            const destination = isAdmin ? '/admin' : '/dashboard';
            navigate(destination);
        }
    }, [user, isAdmin, isLoading, navigate]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-muted/50 p-4 sm:p-6 lg:p-8">
            <Card className="w-full max-w-md shadow-lg">
                <CardHeader className="space-y-1 text-center">
                    <CardTitle className="text-2xl font-bold">Koru Booking</CardTitle>
                    <CardDescription>
                        Enter your credentials to access the backoffice
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {oauthConfigured && (
                        <div className="space-y-3 mb-4">
                            <Button
                                type="button"
                                variant="outline"
                                className="w-full"
                                onClick={startGoogleFlow}
                                disabled={isLoading || redirecting}
                            >
                                <img src="/koru-logo.png" alt="" aria-hidden="true" className="mr-2 h-5 w-5 object-contain" />
                                {redirecting ? 'Redirigiendo…' : 'Ingresar con KoruSuite'}
                            </Button>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <span className="h-px flex-1 bg-border" />
                                <span>o con usuario y contraseña</span>
                                <span className="h-px flex-1 bg-border" />
                            </div>
                        </div>
                    )}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="username">Username</Label>
                            <Input
                                id="username"
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder="Enter your username"
                                required
                                disabled={isLoading}
                                autoComplete="username"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <Input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                required
                                disabled={isLoading}
                                autoComplete="current-password"
                            />
                        </div>

                        {error && (
                            <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-md">
                                {error}
                            </div>
                        )}

                        <Button
                            type="submit"
                            className="w-full"
                            disabled={isLoading || redirecting}
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
