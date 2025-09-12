import React from 'react';
import { useApi } from '@/hooks/useApi';
import { userApi } from '@/services/api';
import { User } from '@/types';
import Button from '@/components/ui/Button';

const UserList: React.FC = () => {
    const { data: users, loading, error, refetch } = useApi<User[]>(userApi.getUsers);

    if (loading) {
        return (
            <div className="flex justify-center items-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-2">Loading users...</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h3 className="text-red-800 font-medium">Error loading users</h3>
                <p className="text-red-600 text-sm mt-1">{error}</p>
                <Button
                    onClick={refetch}
                    variant="outline"
                    size="sm"
                    className="mt-3"
                >
                    Try Again
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">Users</h2>
                <Button onClick={refetch} variant="outline" size="sm">
                    Refresh
                </Button>
            </div>

            {users && users.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {users.map((user) => (
                        <div key={user.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                            <h3 className="font-medium text-gray-900">{user.name}</h3>
                            <p className="text-sm text-gray-600">{user.email}</p>
                            <span className={`inline-block px-2 py-1 text-xs rounded-full mt-2 ${user.role === 'admin'
                                    ? 'bg-red-100 text-red-800'
                                    : user.role === 'user'
                                        ? 'bg-blue-100 text-blue-800'
                                        : 'bg-gray-100 text-gray-800'
                                }`}>
                                {user.role}
                            </span>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-8 text-gray-500">
                    No users found
                </div>
            )}
        </div>
    );
};

export default UserList;
