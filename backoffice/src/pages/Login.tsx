import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Login.css';

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
        <div className="login-container">
            <div className="login-card">
                <div className="login-header">
                    <h1>Koru Booking</h1>
                    <p>Backoffice Access</p>
                </div>

                <form onSubmit={handleSubmit} className="login-form">
                    <div className="form-group">
                        <label htmlFor="identifier">Website ID / Email</label>
                        <input
                            id="identifier"
                            type="text"
                            value={identifier}
                            onChange={(e) => setIdentifier(e.target.value)}
                            placeholder="Enter your Website ID or Email"
                            required
                            disabled={isLoading}
                            autoComplete="username"
                        />
                        <small className="field-hint">
                            Clients: use Website ID | Administrators: use Email
                        </small>
                    </div>

                    <div className="form-group">
                        <label htmlFor="secret">App ID / Password</label>
                        <input
                            id="secret"
                            type="password"
                            value={secret}
                            onChange={(e) => setSecret(e.target.value)}
                            placeholder="Enter your App ID or Password"
                            required
                            disabled={isLoading}
                            autoComplete="current-password"
                        />
                        <small className="field-hint">
                            Clients: use App ID | Administrators: use Password
                        </small>
                    </div>

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

                <div className="login-footer">
                    <p>Enter your credentials to access the backoffice</p>
                </div>
            </div>
        </div>
    );
};

export default Login;
