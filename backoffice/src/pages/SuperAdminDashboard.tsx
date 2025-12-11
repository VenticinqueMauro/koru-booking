import React, { useEffect, useState } from 'react';
import { superAdminApi } from '../api/auth';
import { useAuth } from '../contexts/AuthContext';
import './SuperAdminDashboard.css';

interface Account {
    id: string;
    websiteId: string;
    appId: string;
    businessName: string | null;
    active: boolean;
    createdAt: string;
    _count?: {
        services: number;
        bookings: number;
    };
}

interface GlobalStats {
    totalAccounts: number;
    activeAccounts: number;
    totalServices: number;
    totalBookings: number;
    bookingsThisMonth: number;
}

const SuperAdminDashboard: React.FC = () => {
    const { logout } = useAuth();
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [stats, setStats] = useState<GlobalStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [accountsData, statsData] = await Promise.all([
                superAdminApi.getAllAccounts(),
                superAdminApi.getGlobalStats(),
            ]);
            setAccounts(accountsData as any);
            setStats(statsData as any);
        } catch (err: any) {
            setError(err.message || 'Error loading data');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="super-admin-container">
                <div className="loading">Loading...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="super-admin-container">
                <div className="error">{error}</div>
            </div>
        );
    }

    return (
        <div className="super-admin-container">
            <header className="super-admin-header">
                <div>
                    <h1>Super Admin Dashboard</h1>
                    <p>Manage all client accounts</p>
                </div>
                <button onClick={logout} className="logout-button">
                    Logout
                </button>
            </header>

            {/* Global Stats */}
            {stats && (
                <div className="stats-grid">
                    <div className="stat-card">
                        <div className="stat-value">{stats.totalAccounts}</div>
                        <div className="stat-label">Total Accounts</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-value">{stats.activeAccounts}</div>
                        <div className="stat-label">Active Accounts</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-value">{stats.totalServices}</div>
                        <div className="stat-label">Total Services</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-value">{stats.totalBookings}</div>
                        <div className="stat-label">Total Bookings</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-value">{stats.bookingsThisMonth}</div>
                        <div className="stat-label">Bookings This Month</div>
                    </div>
                </div>
            )}

            {/* Accounts Table */}
            <div className="accounts-section">
                <div className="section-header">
                    <h2>Client Accounts</h2>
                    <button className="refresh-button" onClick={loadData}>
                        Refresh
                    </button>
                </div>

                <div className="accounts-table-container">
                    <table className="accounts-table">
                        <thead>
                            <tr>
                                <th>Business Name</th>
                                <th>Website ID</th>
                                <th>App ID</th>
                                <th>Services</th>
                                <th>Bookings</th>
                                <th>Status</th>
                                <th>Created</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {accounts.map((account) => (
                                <tr key={account.id}>
                                    <td>
                                        <strong>{account.businessName || 'N/A'}</strong>
                                    </td>
                                    <td>
                                        <code className="code-text">{account.websiteId}</code>
                                    </td>
                                    <td>
                                        <code className="code-text">{account.appId}</code>
                                    </td>
                                    <td>{account._count?.services || 0}</td>
                                    <td>{account._count?.bookings || 0}</td>
                                    <td>
                                        <span className={`status-badge ${account.active ? 'active' : 'inactive'}`}>
                                            {account.active ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td>{new Date(account.createdAt).toLocaleDateString()}</td>
                                    <td>
                                        <button
                                            className="view-button"
                                            onClick={() => alert(`View details for ${account.businessName || account.websiteId}`)}
                                        >
                                            View
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default SuperAdminDashboard;
