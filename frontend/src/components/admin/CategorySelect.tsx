'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { 
  Search, 
  ChevronDown, 
  Check, 
  Folder, 
  FolderTree, 
  Tag, 
  X, 
  ExternalLink,
  Layers
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

export interface CategoryItem {
  id: string;
  name: string;
  slug?: string;
  parentId?: string | null;
  children?: CategoryItem[];
}

interface FlatCategory {
  id: string;
  name: string;
  parentName?: string;
  isParent: boolean;
  fullPath: string;
}

interface CategorySelectProps {
  categories: CategoryItem[];
  value: string;
  onChange: (categoryId: string) => void;
  hasError?: boolean;
  placeholder?: string;
}

export default function CategorySelect({
  categories,
  value,
  onChange,
  hasError = false,
  placeholder = 'Select a category...',
}: CategorySelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Flatten the category hierarchy for lightning-fast search and clean rendering
  const { flatList, groupedMap } = useMemo(() => {
    const list: FlatCategory[] = [];
    const grouped = new Map<string, { parent: FlatCategory; children: FlatCategory[] }>();

    (categories || []).forEach(parent => {
      const parentFlat: FlatCategory = {
        id: parent.id,
        name: parent.name,
        isParent: true,
        fullPath: parent.name,
      };
      list.push(parentFlat);

      const childrenFlats: FlatCategory[] = [];
      (parent.children || []).forEach(child => {
        const childFlat: FlatCategory = {
          id: child.id,
          name: child.name,
          parentName: parent.name,
          isParent: false,
          fullPath: `${parent.name} › ${child.name}`,
        };
        list.push(childFlat);
        childrenFlats.push(childFlat);
      });

      grouped.set(parent.id, { parent: parentFlat, children: childrenFlats });
    });

    return { flatList: list, groupedMap: grouped };
  }, [categories]);

  // Selected category info
  const selectedCategory = useMemo(() => {
    return flatList.find(c => c.id === value) || null;
  }, [flatList, value]);

  // Filtered categories based on search input
  const filteredGroups = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) {
      return Array.from(groupedMap.values());
    }

    const matchedGroups: { parent: FlatCategory; children: FlatCategory[] }[] = [];

    groupedMap.forEach(({ parent, children }) => {
      const parentMatches = parent.name.toLowerCase().includes(q);
      const matchedChildren = children.filter(c => 
        c.name.toLowerCase().includes(q) || parent.name.toLowerCase().includes(q)
      );

      if (parentMatches || matchedChildren.length > 0) {
        matchedGroups.push({
          parent,
          children: parentMatches ? children : matchedChildren,
        });
      }
    });

    return matchedGroups;
  }, [groupedMap, search]);

  // Total count of matching items
  const totalMatches = useMemo(() => {
    return filteredGroups.reduce((acc, g) => acc + 1 + g.children.length, 0);
  }, [filteredGroups]);

  // Close popover when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    } else {
      setSearch('');
    }
  }, [isOpen]);

  const handleSelect = (id: string) => {
    onChange(id);
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
  };

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Trigger Button */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setIsOpen(!isOpen);
          } else if (e.key === 'Escape') {
            setIsOpen(false);
          }
        }}
        className={cn(
          'w-full px-3.5 py-2.5 rounded-xl border text-sm transition-all duration-200 cursor-pointer flex items-center justify-between gap-2 select-none bg-white',
          isOpen 
            ? 'border-primary ring-4 ring-primary/10 shadow-sm' 
            : hasError 
              ? 'border-red-400 ring-2 ring-red-100' 
              : 'border-border/80 hover:border-gray-400 focus:border-primary'
        )}
      >
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <div className={cn(
            'w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors',
            selectedCategory ? 'bg-primary/10 text-primary' : 'bg-gray-100 text-gray-400'
          )}>
            <Folder size={15} />
          </div>

          {selectedCategory ? (
            <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
              {selectedCategory.parentName && (
                <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-gray-100 text-gray-600 truncate max-w-[120px]">
                  {selectedCategory.parentName}
                </span>
              )}
              <span className="font-medium text-gray-900 truncate">
                {selectedCategory.name}
              </span>
            </div>
          ) : (
            <span className="text-gray-400 text-sm font-normal">
              {placeholder}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {selectedCategory && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              title="Clear category"
            >
              <X size={14} />
            </button>
          )}
          <ChevronDown
            size={16}
            className={cn(
              'text-gray-400 transition-transform duration-200',
              isOpen && 'rotate-180 text-primary'
            )}
          />
        </div>
      </div>

      {/* Floating Popover Dropdown */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-white rounded-2xl border border-gray-200/90 shadow-2xl shadow-gray-900/10 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          {/* Search Header */}
          <div className="p-2.5 border-b border-gray-100 bg-gray-50/60 sticky top-0 z-10">
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search categories (e.g. Frocks, Boys, Jabla)..."
                className="w-full pl-9 pr-8 py-2 text-xs bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all text-gray-800 placeholder:text-gray-400"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-0.5"
                >
                  <X size={13} />
                </button>
              )}
            </div>
          </div>

          {/* Categories List */}
          <div className="max-h-72 overflow-y-auto p-1.5 space-y-2 overscroll-contain">
            {filteredGroups.length === 0 ? (
              <div className="py-8 px-4 text-center">
                <FolderTree size={28} className="mx-auto text-gray-300 mb-2" />
                <p className="text-xs font-semibold text-gray-700">No categories found</p>
                <p className="text-[11px] text-gray-400 mt-0.5">
                  No matching department or subcategory for "{search}"
                </p>
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="mt-3 text-xs font-semibold text-primary hover:underline"
                >
                  Clear search query
                </button>
              </div>
            ) : (
              filteredGroups.map(({ parent, children }) => {
                const isParentSelected = value === parent.id;

                return (
                  <div key={parent.id} className="rounded-xl overflow-hidden bg-gray-50/40 p-1">
                    {/* Parent Category Header / Selectable Item */}
                    <div
                      onClick={() => handleSelect(parent.id)}
                      className={cn(
                        'w-full flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer text-xs font-bold transition-all select-none',
                        isParentSelected 
                          ? 'bg-primary text-white shadow-xs' 
                          : 'text-gray-800 hover:bg-white hover:shadow-xs'
                      )}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className={cn(
                          'w-2 h-2 rounded-full',
                          isParentSelected ? 'bg-white' : 'bg-primary/70'
                        )} />
                        <span className="uppercase tracking-wider truncate">
                          {parent.name}
                        </span>
                        <span className={cn(
                          'text-[10px] font-medium px-1.5 py-0.2 rounded',
                          isParentSelected ? 'bg-white/20 text-white' : 'bg-gray-200/60 text-gray-500'
                        )}>
                          Department
                        </span>
                      </div>
                      {isParentSelected && <Check size={14} className="shrink-0 ml-2" />}
                    </div>

                    {/* Subcategories */}
                    {children.length > 0 && (
                      <div className="mt-1 pl-3 pr-1 space-y-0.5 border-l-2 border-primary/10 ml-3 my-1">
                        {children.map(child => {
                          const isChildSelected = value === child.id;

                          return (
                            <div
                              key={child.id}
                              onClick={() => handleSelect(child.id)}
                              className={cn(
                                'flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs cursor-pointer transition-all select-none',
                                isChildSelected
                                  ? 'bg-primary text-white font-semibold shadow-xs'
                                  : 'text-gray-600 hover:text-gray-900 hover:bg-white hover:shadow-xs'
                              )}
                            >
                              <div className="flex items-center gap-2 truncate">
                                <span className={cn(
                                  'w-1.5 h-1.5 rounded-full shrink-0',
                                  isChildSelected ? 'bg-white' : 'bg-gray-300'
                                )} />
                                <span className="truncate">{child.name}</span>
                              </div>
                              {isChildSelected && <Check size={13} className="shrink-0 ml-1.5" />}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Quick Footer */}
          <div className="p-2.5 border-t border-gray-100 bg-gray-50/80 flex items-center justify-between text-[11px] text-gray-500">
            <span>
              {totalMatches} {totalMatches === 1 ? 'option' : 'options'} available
            </span>
            <Link
              href="/admin/categories"
              target="_blank"
              className="inline-flex items-center gap-1 font-semibold text-primary hover:underline hover:text-primary-dark transition-colors"
            >
              <span>Manage Categories</span>
              <ExternalLink size={11} />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
