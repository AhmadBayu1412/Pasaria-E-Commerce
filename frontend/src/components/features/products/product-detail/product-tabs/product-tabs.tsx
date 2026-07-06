'use client';

/**
 * Product Tabs Component
 * 
 * Tabbed content for description, specs, and shipping.
 */

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { cn } from '@/lib/cn';
import type { TabType } from '../product-detail.types';

interface Tab {
  id: TabType;
  label: string;
}

const tabs: Tab[] = [
  { id: 'description', label: 'Deskripsi' },
  { id: 'specs', label: 'Spesifikasi' },
  { id: 'shipping', label: 'Pengiriman' },
];

interface ProductTabsProps {
  description: React.ReactNode;
  specifications: React.ReactNode;
  shipping: React.ReactNode;
  className?: string;
}

export function ProductTabs({
  description,
  specifications,
  shipping,
  className,
}: ProductTabsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Get initial tab from URL hash or default to 'description'
  const getInitialTab = (): TabType => {
    const hash = searchParams.get('tab') as TabType;
    if (hash && tabs.some((t) => t.id === hash)) {
      return hash;
    }
    return 'description';
  };

  const [activeTab, setActiveTab] = useState<TabType>(getInitialTab);

  // Sync tab with URL
  const handleTabChange = (tabId: TabType) => {
    setActiveTab(tabId);
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', tabId);
    router.push(`?${params.toString()}`, { scroll: false });
  };

  return (
    <div className={cn('', className)}>
      {/* Tab List */}
      <div
        role="tablist"
        aria-label="Informasi produk"
        className="flex border-b border-secondary-200"
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            id={`tab-${tab.id}`}
            aria-selected={activeTab === tab.id}
            aria-controls={`panel-${tab.id}`}
            onClick={() => handleTabChange(tab.id)}
            className={cn(
              'px-6 py-3 text-sm font-medium border-b-2 transition-colors duration-200',
              'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-inset',
              activeTab === tab.id
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-secondary-600 hover:text-secondary-900 hover:border-secondary-300'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Panels */}
      <div className="py-6">
        {tabs.map((tab) => (
          <div
            key={tab.id}
            role="tabpanel"
            id={`panel-${tab.id}`}
            aria-labelledby={`tab-${tab.id}`}
            hidden={activeTab !== tab.id}
            tabIndex={0}
            className={cn(
              'outline-none',
              activeTab === tab.id ? 'block' : 'hidden'
            )}
          >
            {tab.id === 'description' && description}
            {tab.id === 'specs' && specifications}
            {tab.id === 'shipping' && shipping}
          </div>
        ))}
      </div>
    </div>
  );
}
