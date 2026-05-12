import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { consumeOauthFlow } from '../lib/oauth-pkce';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type Status = 'working' | 'error';

const AuthCallback: React.FC = () => {
    const [params] = useSearchParams();
    const navigate = useNavigate();
    const { finishOauthLogin, isAdmin } = useAuth();
    const [status, setStatus] = useState<Status>('working');
    const [message, setMessage] = useState('Iniciando sesión…');
    const ran = useRef(false);

    useEffect(() => {
        // StrictMode dispara dos veces en dev; el exchange es single-use.
        if (ran.current) return;
        ran.current = true;

        const code = params.get('code');
        const state = params.get('state');
        const error = params.get('error');

        const flow = consumeOauthFlow();

        if (error) {
            setStatus('error');
            setMessage(messageForError(error));
            return;
        }
        if (!code || !state) {
            setStatus('error');
            setMessage('Faltan parámetros del callback. Volvé a intentarlo.');
            return;
        }
        if (!flow || flow.state !== state) {
            setStatus('error');
            setMessage('La sesión de login expiró o fue alterada. Volvé a intentarlo.');
            return;
        }

        finishOauthLogin(code, flow.codeVerifier)
            .then(() => {
                navigate(isAdmin ? '/admin' : '/dashboard', { replace: true });
            })
            .catch((err: any) => {
                setStatus('error');
                setMessage(err?.message || 'No se pudo completar el login.');
            });
    }, [params, finishOauthLogin, isAdmin, navigate]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-muted/50 p-4 sm:p-6 lg:p-8">
            <Card className="w-full max-w-md shadow-lg">
                <CardHeader className="space-y-1 text-center">
                    <CardTitle className="text-2xl font-bold">Koru Booking</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-center">
                    {status === 'working' ? (
                        <>
                            <Loader2 className="mx-auto h-6 w-6 animate-spin text-primary" />
                            <p className="text-sm text-muted-foreground">{message}</p>
                        </>
                    ) : (
                        <>
                            <p className="text-sm font-medium text-destructive">{message}</p>
                            <Button onClick={() => navigate('/login', { replace: true })}>
                                Volver al login
                            </Button>
                        </>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

function messageForError(error: string): string {
    switch (error) {
        case 'access_denied':
            return 'El login fue cancelado.';
        case 'login_required':
            return 'No podés acceder a esta app. Verificá que tu cuenta tenga la app contratada.';
        case 'server_error':
            return 'KoruSuite tuvo un problema. Intentá de nuevo en un momento.';
        case 'invalid_request':
            return 'Pedido inválido.';
        default:
            return 'No se pudo completar el login.';
    }
}

export default AuthCallback;
