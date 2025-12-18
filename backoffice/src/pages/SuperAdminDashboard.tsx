import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { superAdminApi } from '../api/auth';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, Users, CheckCircle, Mail, RotateCw, LogOut } from 'lucide-react';

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
            toast.success('Cuenta actualizada correctamente');
            handleCloseModal();
        } catch (err: any) {
            toast.error(err.message || 'Error al actualizar la cuenta');
        } finally {
            setIsSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center p-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex min-h-screen items-center justify-center p-4 text-destructive">
                {error}
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-muted/40 p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8">
            <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Super Admin Dashboard</h1>
                    <p className="text-muted-foreground">User Account Management</p>
                </div>
                <Button variant="outline" onClick={logout}>
                    <LogOut className="mr-2 h-4 w-4" /> Logout
                </Button>
            </header>

            {/* Summary Stats */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Accounts</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{accounts.length}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Accounts</CardTitle>
                        <CheckCircle className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{accounts.filter(a => a.active).length}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">With Credentials</CardTitle>
                        <Mail className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{accounts.filter(a => a.email).length}</div>
                    </CardContent>
                </Card>
            </div>

            {/* Accounts Table */}
            <Card>
                <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between space-y-2 sm:space-y-0">
                    <div>
                        <CardTitle>Registered Users</CardTitle>
                        <CardDescription>Manage your platform users and their credentials.</CardDescription>
                    </div>
                    <Button variant="outline" size="sm" onClick={loadData}>
                        <RotateCw className="mr-2 h-4 w-4" /> Refresh
                    </Button>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Business Name</TableHead>
                                    <TableHead>Website ID</TableHead>
                                    <TableHead>App ID</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Reference Website</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Created</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {accounts.map((account) => (
                                    <TableRow key={account.id}>
                                        <TableCell className="font-medium">{account.businessName || 'N/A'}</TableCell>
                                        <TableCell><code className="bg-muted px-1 py-0.5 rounded text-xs">{account.websiteId}</code></TableCell>
                                        <TableCell><code className="bg-muted px-1 py-0.5 rounded text-xs">{account.appId}</code></TableCell>
                                        <TableCell>
                                            {account.email || <span className="text-muted-foreground italic text-xs">Not set</span>}
                                        </TableCell>
                                        <TableCell>
                                            {account.referenceWebsite ? (
                                                <a href={account.referenceWebsite} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline underline-offset-4">
                                                    Link
                                                </a>
                                            ) : (
                                                <span className="text-muted-foreground italic text-xs">Not set</span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={account.active ? 'default' : 'secondary'}>
                                                {account.active ? 'Active' : 'Inactive'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-muted-foreground text-xs">
                                            {new Date(account.createdAt).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleEditAccount(account)}
                                            >
                                                Edit
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            <Dialog open={!!editingAccount} onOpenChange={(open) => !open && handleCloseModal()}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Edit Account</DialogTitle>
                        <DialogDescription>
                            Make changes to the account credentials and details.
                        </DialogDescription>
                    </DialogHeader>

                    {editingAccount && (
                        <form onSubmit={handleSaveAccount} className="grid gap-4 py-4">
                            {/* Read only info */}
                            <div className="grid gap-2 text-sm bg-muted/50 p-3 rounded-md">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Business:</span>
                                    <span className="font-medium">{editingAccount.businessName || 'N/A'}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Website ID:</span>
                                    <code className="text-xs">{editingAccount.websiteId}</code>
                                </div>
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    placeholder="user@example.com"
                                    disabled={isSaving}
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="password">Password</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    placeholder="Leave empty to keep current"
                                    disabled={isSaving}
                                />
                                <p className="text-xs text-muted-foreground">Only enter if you want to change it.</p>
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="referenceWebsite">Reference Website</Label>
                                <Input
                                    id="referenceWebsite"
                                    type="url"
                                    value={formData.referenceWebsite}
                                    onChange={(e) => setFormData({ ...formData, referenceWebsite: e.target.value })}
                                    placeholder="https://example.com"
                                    disabled={isSaving}
                                />
                            </div>

                            <DialogFooter>
                                <Button type="button" variant="ghost" onClick={handleCloseModal} disabled={isSaving}>
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={isSaving}>
                                    {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Save Changes
                                </Button>
                            </DialogFooter>
                        </form>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default SuperAdminDashboard;
