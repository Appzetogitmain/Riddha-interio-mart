import React, { useState, useEffect } from 'react';
import { Search, X, Loader } from 'lucide-react';
import api from '../../../shared/utils/api';

const ProductMultiSelect = ({ selected = [], onChange, mode = 'seller' }) => {
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [filteredProducts, setFilteredProducts] = useState([]);

  useEffect(() => {
    fetchProducts();
  }, [mode]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      let url = '/api/products/my-products';
      if (mode === 'admin') {
        url = '/api/products?limit=100&isApproved=true';
      }
      const res = await api.get(url);
      const productsData = res.data?.data || [];
      setProducts(productsData);
      setFilteredProducts(productsData);
    } catch (err) {
      console.error('Failed to fetch products:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredProducts(products);
    } else {
      const filtered = products.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.sku?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredProducts(filtered);
    }
  }, [searchTerm, products]);

  const toggleProduct = (productId) => {
    if (selected.includes(productId)) {
      onChange(selected.filter(id => id !== productId));
    } else {
      onChange([...selected, productId]);
    }
  };

  const removeProduct = (productId) => {
    onChange(selected.filter(id => id !== productId));
  };

  const selectedProducts = products.filter(p => selected.includes(p._id));

  return (
    <div className="space-y-4">
      <div>
        <label className="text-xs font-bold text-slate-600 uppercase tracking-wider ml-1 block mb-2">
          Select Products
        </label>

        {/* Search input */}
        <div className="relative mb-4">
          <Search size={16} className="absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search by product name or SKU..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Selected products */}
        {selectedProducts.length > 0 && (
          <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-xs font-semibold text-blue-700 mb-2">
              Selected Products ({selectedProducts.length})
            </p>
            <div className="flex flex-wrap gap-2">
              {selectedProducts.map(product => (
                <div
                  key={product._id}
                  className="inline-flex items-center gap-2 px-2 py-1 bg-white border border-blue-300 rounded text-xs"
                >
                  <span className="font-medium text-blue-900">{product.name}</span>
                  <button
                    onClick={() => removeProduct(product._id)}
                    className="text-blue-600 hover:text-red-600 transition"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Products list */}
        <div className="max-h-64 overflow-y-auto border border-slate-200 rounded-lg">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader className="animate-spin text-blue-500" size={20} />
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-xs">
              {products.length === 0 ? 'No products available' : 'No products match your search'}
            </div>
          ) : (
            <div className="divide-y">
              {filteredProducts.map(product => (
                <label
                  key={product._id}
                  className="flex items-center gap-3 p-3 hover:bg-slate-50 cursor-pointer transition"
                >
                  <input
                    type="checkbox"
                    checked={selected.includes(product._id)}
                    onChange={() => toggleProduct(product._id)}
                    className="w-4 h-4 rounded border-slate-300 cursor-pointer"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-900 truncate">{product.name}</p>
                    <p className="text-xs text-slate-500">{product.sku}</p>
                  </div>
                  <p className="text-xs font-bold text-slate-600 whitespace-nowrap">
                    ₹{product.price?.toLocaleString()}
                  </p>
                </label>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductMultiSelect;
