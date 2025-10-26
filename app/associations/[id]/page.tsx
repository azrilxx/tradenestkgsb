'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Users, TrendingUp, Bell, AlertCircle, Package } from 'lucide-react';

interface Association {
  id: string;
  name: string;
  sector: string;
  member_count: number;
  description?: string;
  user_role: string;
  watchlist_count: number;
  alert_count: number;
}

interface Watchlist {
  id: string;
  watchlist_name: string;
  hs_codes: string[];
  alert_types: string[];
  description?: string;
  created_at: string;
}

interface GroupAlert {
  id: string;
  title: string;
  message: string;
  alert_type: string;
  priority: string;
  created_at: string;
}

export default function AssociationDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const [association, setAssociation] = useState<Association | null>(null);
  const [watchlists, setWatchlists] = useState<Watchlist[]>([]);
  const [alerts, setAlerts] = useState<GroupAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'watchlists' | 'alerts'>('overview');

  useEffect(() => {
    if (id) {
      fetchAssociation();
      fetchWatchlists();
      fetchAlerts();
    }
  }, [id]);

  const fetchAssociation = async () => {
    try {
      const response = await fetch(`/api/associations/${id}`);
      const result = await response.json();

      if (result.success) {
        setAssociation(result.data);
      }
    } catch (err) {
      console.error('Error fetching association:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchWatchlists = async () => {
    try {
      const response = await fetch(`/api/associations/${id}/watchlist`);
      const result = await response.json();

      if (result.success) {
        setWatchlists(result.data || []);
      }
    } catch (err) {
      console.error('Error fetching watchlists:', err);
    }
  };

  const fetchAlerts = async () => {
    try {
      const response = await fetch(`/api/associations/${id}/alerts?limit=10`);
      const result = await response.json();

      if (result.success) {
        setAlerts(result.data || []);
      }
    } catch (err) {
      console.error('Error fetching alerts:', err);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-8">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  if (!association) {
    return (
      <div className="container mx-auto p-8">
        <div className="text-red-500">Association not found</div>
      </div>
    );
  }

  const getAlertColor = (type: string) => {
    switch (type) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'info':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  return (
    <div className="container mx-auto p-8">
      <div className="mb-6">
        <Link href="/associations" className="text-blue-600 hover:text-blue-700 mb-2">
          ← Back to Associations
        </Link>
      </div>

      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {association.name}
            </h1>
            <p className="text-gray-600">{association.sector}</p>
            {association.description && (
              <p className="text-gray-700 mt-3">{association.description}</p>
            )}
          </div>
          {association.user_role === 'admin' && (
            <button className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg flex items-center gap-2">
              <span className="w-4 h-4">⚙️</span>
              Settings
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Members</p>
              <p className="text-2xl font-bold text-gray-900">{association.member_count}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Package className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Watchlists</p>
              <p className="text-2xl font-bold text-gray-900">{association.watchlist_count}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <Bell className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Recent Alerts</p>
              <p className="text-2xl font-bold text-gray-900">{association.alert_count}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="flex gap-4 px-6 pt-4">
            <button
              onClick={() => setActiveTab('overview')}
              className={`pb-3 px-2 border-b-2 ${activeTab === 'overview'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('watchlists')}
              className={`pb-3 px-2 border-b-2 ${activeTab === 'watchlists'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
            >
              Watchlists
            </button>
            <button
              onClick={() => setActiveTab('alerts')}
              className={`pb-3 px-2 border-b-2 ${activeTab === 'alerts'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
            >
              Alerts
            </button>
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'overview' && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Recent Activity
              </h3>
              <div className="text-gray-600">No recent activity</div>
            </div>
          )}

          {activeTab === 'watchlists' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Watchlists</h3>
                {association.user_role === 'admin' && (
                  <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg">
                    + Add Watchlist
                  </button>
                )}
              </div>
              {watchlists.length === 0 ? (
                <div className="text-center py-12 text-gray-600">
                  No watchlists yet
                </div>
              ) : (
                <div className="space-y-4">
                  {watchlists.map((watchlist) => (
                    <div
                      key={watchlist.id}
                      className="border border-gray-200 rounded-lg p-4"
                    >
                      <h4 className="font-semibold text-gray-900 mb-2">
                        {watchlist.watchlist_name}
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {watchlist.hs_codes.slice(0, 5).map((code, idx) => (
                          <span
                            key={idx}
                            className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded"
                          >
                            {code}
                          </span>
                        ))}
                        {watchlist.hs_codes.length > 5 && (
                          <span className="text-gray-500 text-xs">
                            +{watchlist.hs_codes.length - 5} more
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'alerts' && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Group Alerts
              </h3>
              {alerts.length === 0 ? (
                <div className="text-center py-12 text-gray-600">
                  No alerts yet
                </div>
              ) : (
                <div className="space-y-3">
                  {alerts.map((alert) => (
                    <div
                      key={alert.id}
                      className={`border-2 rounded-lg p-4 ${getAlertColor(alert.alert_type)}`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-semibold mb-1">{alert.title}</h4>
                          <p className="text-sm mb-2">{alert.message}</p>
                          <p className="text-xs opacity-75">
                            {new Date(alert.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded ${alert.priority === 'urgent' ? 'bg-red-200' :
                            alert.priority === 'high' ? 'bg-orange-200' :
                              'bg-blue-200'
                          }`}>
                          {alert.priority}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

