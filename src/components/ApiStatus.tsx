import React from 'react';
import { useApi } from '@/hooks/useApi';
import { genericApi } from '@/services/api';

const ApiStatus: React.FC = () => {
    const { data: healthData, loading, error } = useApi(
        genericApi.healthCheck,
        [] // Empty dependency array means it only runs once
    );

    return (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-2">API Status</h3>

            {loading && (
                <div className="flex items-center text-blue-600">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                    Checking API status...
                </div>
            )}

            {error && (
                <div className="flex items-center text-red-600">
                    <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    API is offline: {error}
                </div>
            )}

            {healthData && (
                <div className="flex items-center text-green-600">
                    <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    API is online - {healthData.status}
                    {healthData.timestamp && (
                        <span className="text-xs text-gray-500 ml-2">
                            ({new Date(healthData.timestamp).toLocaleString()})
                        </span>
                    )}
                </div>
            )}
        </div>
    );
};

export default ApiStatus;
