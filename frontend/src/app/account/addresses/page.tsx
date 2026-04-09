'use client';

import { MapPin, Plus } from 'lucide-react';

export default function AddressesPage() {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">Saved Addresses</h2>
        <button className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors">
          <Plus size={16} /> Add New
        </button>
      </div>

      <div className="text-center py-16 bg-surface rounded-xl">
        <MapPin size={40} className="text-muted mx-auto mb-4" />
        <p className="text-lg font-semibold mb-1">No saved addresses</p>
        <p className="text-sm text-muted">Add an address for faster checkout.</p>
      </div>
    </div>
  );
}
