import React, { useEffect, useState } from 'react';
import { superAdminApi } from '../api/auth';
import { useAuth } from '../contexts/AuthContext';
import './SuperAdminDashboard.css';

interface Account {
    id: string;
    websiteId: string;
    appId: string;
    businessName: string | null;
    email: string | null;
    password: string | null;
    referenceWebsite: string | null;
    active: boolean;
    createdAt: string;
}

interface AccountFormData {
    email: string;
    password: string;
    referenceWebsite: string;
}

const SuperAdminDashboard: React.FC = () => {
    const { logout } = useAuth();
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [editingAccount, setEditingAccount] = useState<Account | null>(null);
    const [formData, setFormData] = useState<AccountFormData>({
        email: '',
        password: '',
        referenceWebsite: '',
    });
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const accountsData = await superAdminApi.getAllAccounts();
            setAccounts(accountsData as any);
        } catch (err: any) {
            setError(err.message || 'Error loading data');
        } finally {
            setLoading(false);
        }
    };

    const handleEditAccount = (account: Account) => {
        setEditingAccount(account);
        setFormData({
            email: account.email || '',
            password: '',
            referenceWebsite: account.referenceWebsite || '',
        });
    };

    const handleCloseModal = () => {
        setEditingAccount(null);
        setFormData({ email: '', password: '', referenceWebsite: '' });
        setIsSaving(false);
    };

    const handleSaveAccount = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingAccount) return;

        setIsSaving(true);
        try {
            await superAdminApi.updateAccount(editingAccount.id, formData);
            await loadData();
            handleCloseModal();
        } catch (err: any) {
            alert(err.message || 'Error updating account');
        } finally {
            setIsSaving(false);
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
                    <p>User Account Management</p>
                </div>
                <button onClick={logout} className="logout-button">
                    Logout
                </button>
            </header>

            {/* Summary Stats */}
            <div className="stats-summary">
                <div className="stat-item">
                    <span className="stat-number">{accounts.length}</span>
                    <span className="stat-text">Total Accounts</span>
                </div>
                <div className="stat-item">
                    <span className="stat-number">{accounts.filter(a => a.active).length}</span>
                    <span className="stat-text">Active</span>
                </div>
                <div className="stat-item">
                    <span className="stat-number">{accounts.filter(a => a.email).length}</span>
                    <span className="stat-text">With Credentials</span>
                </div>
            </div>

            {/* Accounts Table */}
            <div className="accounts-section">
                <div className="section-header">
                    <h2>Registered Users</h2>
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
                                <th>Email</th>
                                <th>Reference Website</th>
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
                                    <td>
                                        {account.email ? (
                                            <span className="email-text">{account.email}</span>
                                        ) : (
                                            <span className="not-set">Not set</span>
                                        )}
                                    </td>
                                    <td>
                                        {account.referenceWebsite ? (
                                            <a href={account.referenceWebsite} target="_blank" rel="noopener noreferrer" className="website-link">
                                                {account.referenceWebsite}
                                            </a>
                                        ) : (
                                            <span className="not-set">Not set</span>
                                        )}
                                    </td>
                                    <td>
                                        <span className={`status-badge ${account.active ? 'active' : 'inactive'}`}>
                                            {account.active ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td>{new Date(account.createdAt).toLocaleDateString()}</td>
                                    <td>
                                        <button
                                            className="edit-button"
                                            onClick={() => handleEditAccount(account)}
                                        >
                                            Edit
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Edit Account Modal */}
            {editingAccount && (
                <div className="modal-overlay" onClick={handleCloseModal}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Edit Account</h3>
                            <button className="modal-close" onClick={handleCloseModal}>×</button>
                        </div>

                        <div className="account-info">
                            <p><strong>Business:</strong> {editingAccount.businessName || 'N/A'}</p>
                            <p><strong>Website ID:</strong> <code>{editingAccount.websiteId}</code></p>
                            <p><strong>App ID:</strong> <code>{editingAccount.appId}</code></p>
                        </div>

                        <form onSubmit={handleSaveAccount} className="modal-form">
                            <div className="form-field">
                                <label htmlFor="email">Email</label>
                                <input
                                    id="email"
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    placeholder="user@example.com"
                                    disabled={isSaving}
                                />
                                <small>Email for account access</small>
                            </div>

                            <div className="form-field">
                                <label htmlFor="password">Password</label>
                                <input
                                    id="password"
                                    type="password"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    placeholder="Leave empty to keep current"
                                    disabled={isSaving}
                                />
                                <small>Leave empty to keep current password</small>
                            </div>

                            <div className="form-field">
                                <label htmlFor="referenceWebsite">Reference Website</label>
                                <input
                                    id="referenceWebsite"
                                    type="url"
                                    value={formData.referenceWebsite}
                                    onChange={(e) => setFormData({ ...formData, referenceWebsite: e.target.value })}
                                    placeholder="https://example.com"
                                    disabled={isSaving}
                                />
                                <small>Client's website for identification</small>
                            </div>

                            <div className="modal-actions">
                                <button
                                    type="button"
                                    onClick={handleCloseModal}
                                    className="button-secondary"
                                    disabled={isSaving}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="button-primary"
                                    disabled={isSaving}
                                >
                                    {isSaving ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SuperAdminDashboard;
