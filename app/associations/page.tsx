'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Users, TrendingUp, Bell, Settings } from 'lucide-react';

interface Association {
  id: string;
  name: string;
  sector: string;
  member_count: number;
  status: string;
  description?: string;
  user_role: string;
  joined_at?: string;
}

export default function AssociationsPage() {
  const [associations, setAssociations] = useState<Association[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAssociations();
  }, []);

  const fetchAssociations = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/associations');
      const result = await response.json();

      if (result.success) {
        setAssociations(result.data || []);
      } else {
        setError(result.error || 'Failed to fetch associations');
      }
    } catch (err) {
      console.error('Error fetching associations:', err);
      setError('Failed to fetch associations');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500">Loading associations...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  const sectorColors: Record<string, string> = {
    'Steel & Metals': 'bg-gray-600',
    'Electronics & Electrical': 'bg-blue-600',
    'Chemicals & Petrochemicals': 'bg-purple-600',
    'Food & Beverage': 'bg-green-600',
    'Textiles & Apparel': 'bg-pink-600',
    'Automotive & Parts': 'bg-red-600',
  };

  return (
    <div className="container mx-auto p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Associations</h1>
        <p className="text-gray-600">
          Manage your industry association memberships and monitor sector-wide trends
        </p>
      </div>

      {associations.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            No Association Memberships
          </h2>
          <p className="text-gray-600 mb-6">
            You are not currently a member of any associations.
          </p>
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg">
            Join an Association
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {associations.map((assoc) => (
            <Link
              key={assoc.id}
              href={`/associations/${assoc.id}`}
              className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-6"
            >
              <div className="flex items-start justify-between mb-4">
                <div
                  className={`w-12 h-12 rounded-lg ${sectorColors[assoc.sector] || 'bg-gray-600'
                    } flex items-center justify-center text-white font-bold`}
                >
                  {assoc.sector.charAt(0)}
                </div>
                {assoc.user_role === 'admin' && (
                  <span className="bg-purple-100 text-purple-700 text-xs px-2 py-1 rounded-full">
                    Admin
                  </span>
                )}
              </div>

              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                {assoc.name}
              </h3>
              <p className="text-sm text-gray-500 mb-4">{assoc.sector}</p>

              {assoc.description && (
                <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                  {assoc.description}
                </p>
              )}

              <div className="flex items-center gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  <span>{assoc.member_count} members</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

