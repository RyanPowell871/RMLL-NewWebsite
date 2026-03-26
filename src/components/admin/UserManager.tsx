import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Switch } from '../ui/switch';
import { Badge } from '../ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../ui/alert-dialog';
import { Plus, Edit, Trash2, Save, X, Search, Eye, EyeOff, Shield, UserCog } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import {
  fetchUsers,
  createUser,
  updateUser,
  deleteUser,
  type User,
} from '../../services/cms-api';

export function UserManager() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Filters
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const data = await fetchUsers();
      setUsers(data);
    } catch (error) {
      console.error('Error loading users:', error);
      toast.error('Failed to load users');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  // Filter users
  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      if (roleFilter !== 'all' && user.role !== roleFilter) return false;
      if (statusFilter === 'active' && !user.is_active) return false;
      if (statusFilter === 'inactive' && user.is_active) return false;
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          user.name.toLowerCase().includes(query) ||
          user.email.toLowerCase().includes(query)
        );
      }
      return true;
    });
  }, [users, roleFilter, statusFilter, searchQuery]);

  const handleCreate = () => {
    setEditingUser({
      name: '',
      email: '',
      role: 'viewer',
      is_active: true,
    } as User);
    setPassword('');
    setIsCreating(true);
    setIsEditing(true);
  };

  const handleEdit = (user: User) => {
    setEditingUser({ ...user });
    setPassword('');
    setIsCreating(false);
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (!editingUser?.name || !editingUser?.email) {
      toast.error('Name and email are required');
      return;
    }

    if (isCreating && !password) {
      toast.error('Password is required for new users');
      return;
    }

    if (isCreating && password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setIsSaving(true);
    try {
      if (isCreating) {
        // Create user with password
        await createUser({
          ...editingUser,
          password,
        } as any);
        toast.success('User created successfully');
      } else if (editingUser.id) {
        await updateUser(editingUser.id, editingUser);
        toast.success('User updated successfully');
      }
      
      setIsEditing(false);
      setIsCreating(false);
      setEditingUser(null);
      setPassword('');
      loadUsers();
    } catch (error) {
      console.error('Error saving user:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to save user');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteUser(id);
      toast.success('User deleted successfully');
      loadUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Failed to delete user');
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setIsCreating(false);
    setEditingUser(null);
    setPassword('');
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return <Badge className="bg-red-100 text-red-800 border-red-200"><Shield className="w-3 h-3 mr-1" />Admin</Badge>;
      case 'editor':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200"><Edit className="w-3 h-3 mr-1" />Editor</Badge>;
      default:
        return <Badge variant="outline"><Eye className="w-3 h-3 mr-1" />Viewer</Badge>;
    }
  };

  if (isEditing && editingUser) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={handleCancel}>
            <X className="w-4 h-4 mr-1" /> Back
          </Button>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {isCreating ? 'Create New User' : `Edit User: ${editingUser.name}`}
          </h2>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCog className="w-5 h-5" />
              {isCreating ? 'New User Details' : 'User Details'}
            </CardTitle>
            <CardDescription>
              {isCreating
                ? 'Create a new CMS user with the details below. They will be able to log in immediately.'
                : 'Update user account details and permissions.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="user-name">Full Name *</Label>
                <Input
                  id="user-name"
                  value={editingUser.name || ''}
                  onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                  placeholder="e.g. John Smith"
                  className="mt-1.5"
                />
              </div>

              <div>
                <Label htmlFor="user-email">Email Address *</Label>
                <Input
                  id="user-email"
                  type="email"
                  value={editingUser.email || ''}
                  onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                  placeholder="email@example.com"
                  className="mt-1.5"
                />
              </div>

              {/* Password field - required for new users, optional for edits */}
              <div>
                <Label htmlFor="user-password">
                  Password {isCreating ? '*' : '(leave blank to keep current)'}
                </Label>
                <div className="relative mt-1.5">
                  <Input
                    id="user-password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={isCreating ? 'Min. 6 characters' : 'Leave blank to keep current'}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {isCreating && (
                  <p className="text-xs text-gray-500 mt-1">
                    The user will use this password to log in at <code className="bg-gray-100 px-1 rounded">/cms</code>
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="user-role">Role</Label>
                <Select
                  value={editingUser.role || 'viewer'}
                  onValueChange={(value: 'admin' | 'editor' | 'viewer') => setEditingUser({ ...editingUser, role: value })}
                >
                  <SelectTrigger id="user-role" className="mt-1.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin (Full Access)</SelectItem>
                    <SelectItem value="editor">Editor (Edit Content)</SelectItem>
                    <SelectItem value="viewer">Viewer (Read Only)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500 mt-1">
                  {editingUser.role === 'admin' && 'Full access: user management, settings, all content.'}
                  {editingUser.role === 'editor' && 'Can create/edit news, pages, documents, and images.'}
                  {editingUser.role === 'viewer' && 'Read-only access to view CMS content.'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2 border-t border-gray-100">
              <Switch
                id="user-active"
                checked={editingUser.is_active}
                onCheckedChange={(checked) => setEditingUser({ ...editingUser, is_active: checked })}
              />
              <Label htmlFor="user-active" className="mb-0">
                Account Active
              </Label>
              <span className="text-xs text-gray-500">
                {editingUser.is_active ? 'User can log in' : 'User is blocked from logging in'}
              </span>
            </div>

            <div className="flex gap-3 pt-4 border-t border-gray-100">
              <Button
                onClick={handleSave}
                disabled={isSaving}
                className="bg-[#013fac] hover:bg-[#0149c9] flex items-center gap-2"
              >
                <Save className="h-4 w-4" />
                {isSaving ? 'Saving...' : isCreating ? 'Create User' : 'Save Changes'}
              </Button>
              <Button onClick={handleCancel} variant="outline" className="flex items-center gap-2">
                <X className="h-4 w-4" />
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">User Management</h2>
          <p className="text-gray-600 dark:text-gray-400">
            Manage CMS users, roles, and access permissions
          </p>
        </div>
        <Button onClick={handleCreate} className="bg-[#013fac] hover:bg-[#0149c9] flex items-center gap-2">
          <Plus className="h-4 w-4" />
          New User
        </Button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger>
            <SelectValue placeholder="Role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="editor">Editor</SelectItem>
            <SelectItem value="viewer">Viewer</SelectItem>
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger>
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <p className="text-sm text-gray-500">
        Showing {filteredUsers.length} of {users.length} users
      </p>

      {isLoading ? (
        <div className="text-center py-12">
          <div className="w-12 h-12 border-4 border-[#013fac] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading users...</p>
        </div>
      ) : filteredUsers.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <UserCog className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              {users.length === 0 ? 'No users yet' : 'No users match your filters'}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {users.length === 0
                ? 'Create your first CMS user to get started.'
                : 'Try adjusting your search or filter criteria.'}
            </p>
            {users.length === 0 && (
              <Button onClick={handleCreate} className="bg-[#013fac] hover:bg-[#0149c9]">
                <Plus className="w-4 h-4 mr-2" />
                Create User
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {filteredUsers.map((user) => (
            <Card key={user.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4 sm:p-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                      <h3 className="text-base font-semibold text-gray-900 dark:text-white truncate">
                        {user.name}
                      </h3>
                      {getRoleBadge(user.role)}
                      {user.is_active ? (
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300 text-[10px]">
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-gray-500 text-[10px]">
                          Inactive
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 truncate">{user.email}</p>
                    <div className="flex items-center gap-4 text-xs text-gray-400 mt-1.5">
                      <span>Created: {new Date(user.created_at).toLocaleDateString()}</span>
                      {user.last_login && (
                        <span>Last login: {new Date(user.last_login).toLocaleDateString()}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(user)}
                      className="flex items-center gap-1.5"
                    >
                      <Edit className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">Edit</span>
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex items-center gap-1.5 text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          <span className="hidden sm:inline">Delete</span>
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete User</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete "{user.name}" ({user.email})? This will remove their account from both the CMS and authentication system. This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(user.id)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Delete User
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
