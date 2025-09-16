'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ChevronDown, Plus, RefreshCw } from 'lucide-react';
import { getBrandsByCategory, getItemsByBrand, addBrandItem, subscribeToBrandsByCategory, subscribeToItemsByBrand, BrandItem } from '@/lib/brands-firestore';


interface CascadingSelectProps {
  onSelectionChange: (category: string, brand: string, item: string) => void;
  className?: string;
  preSelectedCategory?: string;
}

export default function CascadingSelect({ onSelectionChange, className = '', preSelectedCategory }: CascadingSelectProps) {
  const [brands, setBrands] = useState<string[]>([]);
  const [items, setItems] = useState<string[]>([]);
  
  const [selectedCategory, setSelectedCategory] = useState(preSelectedCategory || '');
  const [selectedBrand, setSelectedBrand] = useState('');
  const [selectedItem, setSelectedItem] = useState('');

  // Define the categories list
  const categories = [
    'Art', 'Auto', 'Bicycle', 'Books', 'Ephemera', 'Everyday Carry', 'Fashion', 
    'Furniture', 'HiFi', 'Industrial Design', 'Instruments', 'Lighting', 
    'Miscellaneous', 'Moto', 'Movie', 'Music', 'Photography', 'Tech', 
    'Timepieces', 'Vintage'
  ];

  // Get contextual label for brand/maker field based on category
  const getBrandLabel = (category: string) => {
    switch (category) {
      case 'Art': return 'Artist';
      case 'Music': return 'Artist/Band';
      case 'Photography': return 'Photographer';
      case 'Books': return 'Author';
      case 'Fashion': return 'Designer/Brand';
      case 'Furniture': return 'Designer/Manufacturer';
      case 'Lighting': return 'Designer/Manufacturer';
      case 'Movie': return 'Director/Studio';
      case 'Ephemera': return 'Creator/Publisher';
      case 'Industrial Design': return 'Designer/Manufacturer';
      default: return 'Brand/Maker';
    }
  };
  
  const [showAddBrand, setShowAddBrand] = useState(false);
  const [showAddItem, setShowAddItem] = useState(false);
  const [newBrand, setNewBrand] = useState('');
  const [newItem, setNewItem] = useState('');
  const [addingBrand, setAddingBrand] = useState(false);
  const [addingItem, setAddingItem] = useState(false);
  
  // Refs for auto-focusing input fields
  const newBrandInputRef = useRef<HTMLInputElement>(null);
  const newItemInputRef = useRef<HTMLInputElement>(null);

  // Auto-focus input fields when they appear
  useEffect(() => {
    if (showAddBrand && newBrandInputRef.current) {
      newBrandInputRef.current.focus();
    }
  }, [showAddBrand]);

  useEffect(() => {
    if (showAddItem && newItemInputRef.current) {
      newItemInputRef.current.focus();
    }
  }, [showAddItem]);

  // Load brands from Firestore when category changes
  const loadBrandsFromFirestore = useCallback(async (category: string) => {
    if (!category) return;
    
    try {
      const brandsData = await getBrandsByCategory(category, 100);
      const uniqueBrands = Array.from(new Set(brandsData.map(item => item.brand).filter(Boolean)));
      setBrands(uniqueBrands.sort());
    } catch (error) {
      console.error('Error loading brands from Firestore:', error);
    }
  }, []);

  // Load items from Firestore when brand changes
  const loadItemsFromFirestore = useCallback(async (category: string, brand: string) => {
    if (!category || !brand) return;
    
    try {
      const itemsData = await getItemsByBrand(category, brand, 100);
      const uniqueItems = Array.from(new Set(itemsData.map(item => item.item).filter(Boolean)));
      setItems(uniqueItems.sort());
    } catch (error) {
      console.error('Error loading items from Firestore:', error);
    }
  }, []);

  // Update brands when category changes or when pre-selected category is available
  useEffect(() => {
    const category = preSelectedCategory || selectedCategory;
    if (category) {
      loadBrandsFromFirestore(category);
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
  }, [selectedCategory, preSelectedCategory, loadBrandsFromFirestore]);

  // Update items when brand changes
  useEffect(() => {
    const category = preSelectedCategory || selectedCategory;
    if (category && selectedBrand) {
      loadItemsFromFirestore(category, selectedBrand);
      setSelectedItem('');
    } else {
      setItems([]);
      setSelectedItem('');
    }
  }, [selectedCategory, selectedBrand, preSelectedCategory, loadItemsFromFirestore]);

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
    if (brand === '__add_new__') {
      setShowAddBrand(true);
      setSelectedBrand('');
    } else {
      setSelectedBrand(brand);
      setShowAddBrand(false);
    }
    setShowAddItem(false);
    // Notify parent after state update
    setTimeout(() => notifyParent(), 0);
  };

  const handleItemChange = (item: string) => {
    if (item === '__add_new__') {
      setShowAddItem(true);
      setSelectedItem('');
    } else {
      setSelectedItem(item);
      setShowAddItem(false);
    }
    // Notify parent after state update
    setTimeout(() => notifyParent(), 0);
  };

  const handleAddBrand = async () => {
    const category = preSelectedCategory || selectedCategory;
    if (newBrand.trim() && category && !addingBrand) {
      setAddingBrand(true);
      try {
        // Add to Firestore via API
        const response = await fetch('/api/brands', {
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
          // Refresh brands from Firestore to get the updated list
          await loadBrandsFromFirestore(category);
          setSelectedBrand(newBrand.trim());
          setNewBrand('');
          setShowAddBrand(false);
          // Notify parent immediately with the new brand
          onSelectionChange(category, newBrand.trim(), selectedItem);
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
        // Add to Firestore via API
        const response = await fetch('/api/brands', {
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
          // Refresh items from Firestore to get the updated list
          await loadItemsFromFirestore(category, selectedBrand);
          setSelectedItem(newItem.trim());
          setNewItem('');
          setShowAddItem(false);
          // Notify parent immediately with the new item
          onSelectionChange(category, selectedBrand, newItem.trim());
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
      {/* Refresh Button
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
 */}
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
            {getBrandLabel(preSelectedCategory || selectedCategory)} *
          </label>
          <div className="relative">
            <select
              value={selectedBrand}
              onChange={(e) => handleBrandChange(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-black/20 dark:focus:ring-white/20 focus:border-transparent appearance-none pr-10"
            >
              <option value="">Select a {getBrandLabel(preSelectedCategory || selectedCategory).toLowerCase()}...</option>
              <option value="I don't know">I don't know</option>
              <option value="__add_new__">+ Add new {getBrandLabel(preSelectedCategory || selectedCategory).toLowerCase()}</option>
              {brands.map((brand) => (
                <option key={brand} value={brand}>
                  {brand}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
          </div>
          
          
          {/* Add Brand Input */}
          {showAddBrand && (
            <div className="mt-2 flex gap-2">
              <input
                ref={newBrandInputRef}
                type="text"
                value={newBrand}
                onChange={(e) => setNewBrand(e.target.value)}
                placeholder={`Enter ${getBrandLabel(preSelectedCategory || selectedCategory).toLowerCase()} name...`}
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
              <option value="I don't know">I don't know</option>
              <option value="__add_new__">+ Add new item</option>
              {items.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
          </div>
          
          
          {/* Add Item Input */}
          {showAddItem && (
            <div className="mt-2 flex gap-2">
              <input
                ref={newItemInputRef}
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
