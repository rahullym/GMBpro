'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { locationsApi } from '@/lib/api';
import { Location } from '@/types';
import { 
  MapPinIcon, 
  PlusIcon,
  ArrowPathIcon,
  TrashIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

export default function LocationsPage() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    loadLocations();
  }, []);

  const loadLocations = async () => {
    try {
      const response = await locationsApi.getAll();
      setLocations(response.data);
    } catch (error) {
      console.error('Error loading locations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSyncLocation = async (locationId: string) => {
    setSyncing(locationId);
    try {
      await locationsApi.sync(locationId);
      // Refresh locations to get updated sync time
      await loadLocations();
    } catch (error) {
      console.error('Error syncing location:', error);
    } finally {
      setSyncing(null);
    }
  };

  const handleDeleteLocation = async (locationId: string) => {
    if (!confirm('Are you sure you want to delete this location? This will also delete all associated reviews and replies.')) {
      return;
    }

    try {
      await locationsApi.delete(locationId);
      setLocations(locations.filter(loc => loc.id !== locationId));
    } catch (error) {
      console.error('Error deleting location:', error);
    }
  };

  const getConnectionStatus = (location: Location) => {
    if (!location.lastSyncAt) {
      return {
        status: 'disconnected',
        icon: ExclamationTriangleIcon,
        color: 'text-red-500',
        bgColor: 'bg-red-50',
        text: 'Not Connected'
      };
    }
    
    if (location.lastSyncAt) {
      const lastSync = new Date(location.lastSyncAt);
      const hoursSinceSync = (Date.now() - lastSync.getTime()) / (1000 * 60 * 60);
      
      if (hoursSinceSync < 24) {
        return {
          status: 'connected',
          icon: CheckCircleIcon,
          color: 'text-green-500',
          bgColor: 'bg-green-50',
          text: 'Connected'
        };
      } else {
        return {
          status: 'stale',
          icon: ExclamationTriangleIcon,
          color: 'text-yellow-500',
          bgColor: 'bg-yellow-50',
          text: 'Sync Needed'
        };
      }
    }
    
    return {
      status: 'unknown',
      icon: ExclamationTriangleIcon,
      color: 'text-gray-500',
      bgColor: 'bg-gray-50',
      text: 'Unknown'
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading locations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Locations</h1>
              <p className="text-gray-600">Manage your Google Business Profile locations</p>
            </div>
            <button
              onClick={() => router.push('/locations/connect')}
              className="btn-primary"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Connect Location
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {locations.length === 0 ? (
          <div className="text-center py-12">
            <MapPinIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No locations connected</h3>
            <p className="mt-1 text-sm text-gray-500">
              Get started by connecting your first Google Business Profile location.
            </p>
            <div className="mt-6">
              <button
                onClick={() => router.push('/locations/connect')}
                className="btn-primary"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                Connect Your First Location
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {locations.map((location) => {
              const connectionStatus = getConnectionStatus(location);
              const StatusIcon = connectionStatus.icon;
              
              return (
                <div key={location.id} className="card">
                  <div className="card-body">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                          {location.name}
                        </h3>
                        <p className="text-sm text-gray-600 mb-3">
                          {location.address}
                        </p>
                        
                        {/* Connection Status */}
                        <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${connectionStatus.bgColor} ${connectionStatus.color} mb-3`}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {connectionStatus.text}
                        </div>
                        
                        {/* Location Details */}
                        <div className="space-y-1 text-sm text-gray-500">
                          {location.phoneNumber && (
                            <p>📞 {location.phoneNumber}</p>
                          )}
                          {location.website && (
                            <p>🌐 <a href={location.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                              {location.website}
                            </a></p>
                          )}
                          {location.lastSyncAt && (
                            <p>🔄 Last synced: {new Date(location.lastSyncAt).toLocaleString()}</p>
                          )}
                          <p>⭐ {location._count?.reviews || 0} reviews</p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Actions */}
                    <div className="mt-4 flex space-x-2">
                      <button
                        onClick={() => handleSyncLocation(location.id)}
                        disabled={syncing === location.id}
                        className="btn-secondary flex-1 text-sm"
                      >
                        {syncing === location.id ? (
                          <div className="flex items-center justify-center">
                            <ArrowPathIcon className="h-4 w-4 mr-1 animate-spin" />
                            Syncing...
                          </div>
                        ) : (
                          <div className="flex items-center justify-center">
                            <ArrowPathIcon className="h-4 w-4 mr-1" />
                            Sync Reviews
                          </div>
                        )}
                      </button>
                      
                      <button
                        onClick={() => router.push(`/locations/${location.id}/reviews`)}
                        className="btn-primary flex-1 text-sm"
                      >
                        View Reviews
                      </button>
                      
                      <button
                        onClick={() => handleDeleteLocation(location.id)}
                        className="btn-danger text-sm px-3"
                        title="Delete location"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

