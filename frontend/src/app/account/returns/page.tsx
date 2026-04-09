'use client';

import { RotateCcw } from 'lucide-react';

export default function ReturnsPage() {
  return (
    <div>
      <h2 className="text-xl font-semibold mb-6">Returns & Exchanges</h2>
      <div className="text-center py-16 bg-surface rounded-xl">
        <RotateCcw size={40} className="text-muted mx-auto mb-4" />
        <p className="text-lg font-semibold mb-1">No returns initiated</p>
        <p className="text-sm text-muted">Need to return something? Visit your order and select "Return".</p>
      </div>
    </div>
  );
}
