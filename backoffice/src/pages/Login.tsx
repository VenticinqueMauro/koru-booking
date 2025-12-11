import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Login.css';

type LoginMode = 'koru' | 'admin';

const Login: React.FC = () => {
    const navigate = useNavigate();
    const { login } = useAuth();
    const [mode, setMode] = useState<LoginMode>('koru');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    // Koru credentials
    const [websiteId, setWebsiteId] = useState('');
    const [appId, setAppId] = useState('');

    // Admin credentials
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            if (mode === 'koru') {
                await login({ websiteId, appId });
            } else {
                await login({ email, password });
            }
            navigate('/dashboard');
        } catch (err: any) {
            setError(err.message || 'Login failed');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="login-container">
            <div className="login-card">
                <div className="login-header">
                    <h1>Koru Booking</h1>
                    <p>Backoffice Login</p>
                </div>

                <div className="login-mode-toggle">
                    <button
                        className={mode === 'koru' ? 'active' : ''}
                        onClick={() => setMode('koru')}
                        type="button"
                    >
                        Client Login
                    </button>
                    <button
                        className={mode === 'admin' ? 'active' : ''}
                        onClick={() => setMode('admin')}
                        type="button"
                    >
                        Super Admin
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="login-form">
                    {mode === 'koru' ? (
                        <>
                            <div className="form-group">
                                <label htmlFor="websiteId">Website ID</label>
                                <input
                                    id="websiteId"
                                    type="text"
                                    value={websiteId}
                                    onChange={(e) => setWebsiteId(e.target.value)}
                                    placeholder="Enter your Koru website ID"
                                    required
                                    disabled={isLoading}
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="appId">App ID</label>
                                <input
                                    id="appId"
                                    type="text"
                                    value={appId}
                                    onChange={(e) => setAppId(e.target.value)}
                                    placeholder="Enter your Koru app ID"
                                    required
                                    disabled={isLoading}
                                />
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="form-group">
                                <label htmlFor="email">Email</label>
                                <input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="admin@example.com"
                                    required
                                    disabled={isLoading}
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="password">Password</label>
                                <input
                                    id="password"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Enter your password"
                                    required
                                    disabled={isLoading}
                                />
                            </div>
                        </>
                    )}

                    {error && (
                        <div className="error-message">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        className="login-button"
                        disabled={isLoading}
                    >
                        {isLoading ? 'Logging in...' : 'Login'}
                    </button>
                </form>

                {mode === 'koru' && (
                    <div className="login-footer">
                        <p>Don't have credentials? Contact your Koru Suite administrator.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Login;
