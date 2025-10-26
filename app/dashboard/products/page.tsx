'use client';

import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function ProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/products');
      if (response.ok) {
        const data = await response.json();
        setProducts(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="text-4xl mb-4">⏳</div>
          <p className="text-gray-600">Loading products...</p>
        </div>
      </div>
    );
  }

  const categoryColors: Record<string, string> = {
    Electronics: 'bg-blue-100 text-blue-800',
    Textiles: 'bg-purple-100 text-purple-800',
    Agriculture: 'bg-green-100 text-green-800',
    Petroleum: 'bg-orange-100 text-orange-800',
    Machinery: 'bg-gray-100 text-gray-800',
    Automotive: 'bg-red-100 text-red-800',
    Chemicals: 'bg-yellow-100 text-yellow-800',
    Food: 'bg-pink-100 text-pink-800',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Products</h1>
        <p className="text-gray-600 mt-1">Browse monitored products</p>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((product) => (
          <Card key={product.id} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-3">
                <div className="font-mono text-lg font-bold text-blue-600">
                  {product.hs_code}
                </div>
                <span className={`px-2 py-1 rounded text-xs font-medium ${categoryColors[product.category] || 'bg-gray-100 text-gray-800'}`}>
                  {product.category}
                </span>
              </div>
              <p className="text-gray-700 text-sm">
                {product.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {products.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center text-gray-500">
            <div className="text-4xl mb-4">📦</div>
            <p className="text-lg">No products found</p>
            <p className="text-sm mt-2">Seed the database to add products</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}