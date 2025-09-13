'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { ChevronDown, Plus, RefreshCw } from 'lucide-react';

interface CSVRow {
  category: string;
  brand: string;
  item: string;
  era?: string;
  country?: string;
  type?: string;
  notes?: string;
}

interface CascadingSelectProps {
  onSelectionChange: (category: string, brand: string, item: string) => void;
  className?: string;
  preSelectedCategory?: string;
}

export default function CascadingSelect({ onSelectionChange, className = '', preSelectedCategory }: CascadingSelectProps) {
  const [csvData, setCsvData] = useState<CSVRow[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [brands, setBrands] = useState<string[]>([]);
  const [items, setItems] = useState<string[]>([]);
  
  const [selectedCategory, setSelectedCategory] = useState(preSelectedCategory || '');
  const [selectedBrand, setSelectedBrand] = useState('');
  const [selectedItem, setSelectedItem] = useState('');
  
  const [showAddBrand, setShowAddBrand] = useState(false);
  const [showAddItem, setShowAddItem] = useState(false);
  const [newBrand, setNewBrand] = useState('');
  const [newItem, setNewItem] = useState('');
  const [addingBrand, setAddingBrand] = useState(false);
  const [addingItem, setAddingItem] = useState(false);

  // Load CSV data on component mount and when preSelectedCategory changes
  const loadCSVData = useCallback(async () => {
    try {
      const response = await fetch('/list.csv');
      const csvText = await response.text();
      const lines = csvText.split('\n').slice(1); // Skip header
      
      const data: CSVRow[] = lines
        .filter(line => line.trim())
        .map(line => {
          const columns = line.split(',');
          return {
            category: columns[0]?.trim() || '',
            brand: columns[1]?.trim() || '',
            item: columns[2]?.trim() || '',
            era: columns[3]?.trim() || '',
            country: columns[4]?.trim() || '',
            type: columns[5]?.trim() || '',
            notes: columns[6]?.trim() || ''
          };
        });
      
      setCsvData(data);
      
      // Extract unique categories
      const uniqueCategories = Array.from(new Set(data.map(row => row.category).filter(Boolean)));
      setCategories(uniqueCategories.sort());
    } catch (error) {
      console.error('Error loading CSV data:', error);
    }
  }, []);

  useEffect(() => {
    loadCSVData();
  }, [loadCSVData]);

  // Update brands when category changes or when pre-selected category is available
  useEffect(() => {
    const category = preSelectedCategory || selectedCategory;
    if (category) {
      const categoryBrands = Array.from(
        new Set(
          csvData
            .filter(row => row.category === category)
            .map(row => row.brand)
            .filter(Boolean)
        )
      );
      setBrands(categoryBrands.sort());
      if (!preSelectedCategory) {
        setSelectedBrand('');
        setSelectedItem('');
        setItems([]);
      }
    } else {
      setBrands([]);
      setSelectedBrand('');
      setSelectedItem('');
      setItems([]);
    }
  }, [selectedCategory, preSelectedCategory, csvData]);

  // Update items when brand changes
  useEffect(() => {
    const category = preSelectedCategory || selectedCategory;
    if (category && selectedBrand) {
      const brandItems = Array.from(
        new Set(
          csvData
            .filter(row => row.category === category && row.brand === selectedBrand)
            .map(row => row.item)
            .filter(Boolean)
        )
      );
      setItems(brandItems.sort());
      setSelectedItem('');
    } else {
      setItems([]);
      setSelectedItem('');
    }
  }, [selectedCategory, selectedBrand, preSelectedCategory, csvData]);

  // Helper function to notify parent of changes
  const notifyParent = useCallback(() => {
    const category = preSelectedCategory || selectedCategory;
    onSelectionChange(category, selectedBrand, selectedItem);
  }, [selectedCategory, selectedBrand, selectedItem, preSelectedCategory, onSelectionChange]);

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    setShowAddBrand(false);
    setShowAddItem(false);
    // Notify parent after state update
    setTimeout(() => notifyParent(), 0);
  };

  const handleBrandChange = (brand: string) => {
    setSelectedBrand(brand);
    setShowAddItem(false);
    // Notify parent after state update
    setTimeout(() => notifyParent(), 0);
  };

  const handleItemChange = (item: string) => {
    setSelectedItem(item);
    // Notify parent after state update
    setTimeout(() => notifyParent(), 0);
  };

  const handleAddBrand = async () => {
    const category = preSelectedCategory || selectedCategory;
    if (newBrand.trim() && category && !addingBrand) {
      setAddingBrand(true);
      try {
        // Add to CSV via API
        const response = await fetch('/api/csv-update', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            category: category,
            brand: newBrand.trim(),
            item: '', // Empty item for now
            era: '',
            country: '',
            type: '',
            notes: ''
          }),
        });

        if (response.ok) {
          // Update local state
          const newRow: CSVRow = {
            category: category,
            brand: newBrand.trim(),
            item: '',
            era: '',
            country: '',
            type: '',
            notes: ''
          };
          setCsvData(prev => [...prev, newRow]);
          setBrands(prev => [...prev, newBrand.trim()].sort());
          setSelectedBrand(newBrand.trim());
          setNewBrand('');
          setShowAddBrand(false);
          // Notify parent after state update
          setTimeout(() => notifyParent(), 0);
        } else {
          const error = await response.json();
          console.error('Failed to add brand:', error);
          alert('Failed to add brand. Please try again.');
        }
      } catch (error) {
        console.error('Error adding brand:', error);
        alert('Error adding brand. Please try again.');
      } finally {
        setAddingBrand(false);
      }
    }
  };

  const handleAddItem = async () => {
    const category = preSelectedCategory || selectedCategory;
    if (newItem.trim() && category && selectedBrand && !addingItem) {
      setAddingItem(true);
      try {
        // Add to CSV via API
        const response = await fetch('/api/csv-update', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            category: category,
            brand: selectedBrand,
            item: newItem.trim(),
            era: '',
            country: '',
            type: '',
            notes: ''
          }),
        });

        if (response.ok) {
          // Update local state
          const newRow: CSVRow = {
            category: category,
            brand: selectedBrand,
            item: newItem.trim(),
            era: '',
            country: '',
            type: '',
            notes: ''
          };
          setCsvData(prev => [...prev, newRow]);
          setItems(prev => [...prev, newItem.trim()].sort());
          setSelectedItem(newItem.trim());
          setNewItem('');
          setShowAddItem(false);
          // Notify parent after state update
          setTimeout(() => notifyParent(), 0);
        } else {
          const error = await response.json();
          console.error('Failed to add item:', error);
          alert('Failed to add item. Please try again.');
        }
      } catch (error) {
        console.error('Error adding item:', error);
        alert('Error adding item. Please try again.');
      } finally {
        setAddingItem(false);
      }
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Refresh Button */}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={loadCSVData}
          className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
          title="Refresh CSV data"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      {/* Category Select - Only show if no pre-selected category */}
      {!preSelectedCategory && (
        <div>
          <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
            Category *
          </label>
          <div className="relative">
            <select
              value={selectedCategory}
              onChange={(e) => handleCategoryChange(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-black/20 dark:focus:ring-white/20 focus:border-transparent appearance-none pr-10"
            >
              <option value="">Select a category...</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
          </div>
        </div>
      )}

      {/* Brand Select */}
      {(preSelectedCategory || selectedCategory) && (
        <div>
          <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
            Brand/Maker *
          </label>
          <div className="relative">
            <select
              value={selectedBrand}
              onChange={(e) => handleBrandChange(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-black/20 dark:focus:ring-white/20 focus:border-transparent appearance-none pr-10"
            >
              <option value="">Select a brand...</option>
              {brands.map((brand) => (
                <option key={brand} value={brand}>
                  {brand}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
          </div>
          
          {/* Add Brand Button */}
          {!selectedBrand && (
            <button
              type="button"
              onClick={() => setShowAddBrand(!showAddBrand)}
              className="mt-2 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
            >
              <Plus className="h-4 w-4" />
              Add new brand
            </button>
          )}
          
          {/* Add Brand Input */}
          {showAddBrand && (
            <div className="mt-2 flex gap-2">
              <input
                type="text"
                value={newBrand}
                onChange={(e) => setNewBrand(e.target.value)}
                placeholder="Enter brand name..."
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-black/20 dark:focus:ring-white/20 focus:border-transparent"
                onKeyPress={(e) => e.key === 'Enter' && handleAddBrand()}
              />
              <button
                type="button"
                onClick={handleAddBrand}
                disabled={addingBrand}
                className="px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {addingBrand ? 'Adding...' : 'Add'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Item Select */}
      {(preSelectedCategory || selectedCategory) && selectedBrand && (
        <div>
          <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
            Item/Model *
          </label>
          <div className="relative">
            <select
              value={selectedItem}
              onChange={(e) => handleItemChange(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-black/20 dark:focus:ring-white/20 focus:border-transparent appearance-none pr-10"
            >
              <option value="">Select an item...</option>
              {items.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
          </div>
          
          {/* Add Item Button */}
          {!selectedItem && (
            <button
              type="button"
              onClick={() => setShowAddItem(!showAddItem)}
              className="mt-2 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
            >
              <Plus className="h-4 w-4" />
              Add new item
            </button>
          )}
          
          {/* Add Item Input */}
          {showAddItem && (
            <div className="mt-2 flex gap-2">
              <input
                type="text"
                value={newItem}
                onChange={(e) => setNewItem(e.target.value)}
                placeholder="Enter item name..."
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-black/20 dark:focus:ring-white/20 focus:border-transparent"
                onKeyPress={(e) => e.key === 'Enter' && handleAddItem()}
              />
              <button
                type="button"
                onClick={handleAddItem}
                disabled={addingItem}
                className="px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {addingItem ? 'Adding...' : 'Add'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
