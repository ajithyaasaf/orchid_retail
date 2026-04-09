'use client';

import { User } from 'lucide-react';

export default function ProfilePage() {
  return (
    <div>
      <h2 className="text-xl font-semibold mb-6">My Profile</h2>
      <div className="bg-white border border-border rounded-xl p-6 max-w-lg">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <User size={28} className="text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Guest User</h3>
            <p className="text-sm text-muted">Sign in to sync your data across devices</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-muted mb-1.5 block">Full Name</label>
            <input type="text" placeholder="Enter your name" className="w-full px-4 py-3 border border-border rounded-lg text-sm focus:outline-none focus:border-primary" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted mb-1.5 block">Email</label>
            <input type="email" placeholder="Enter your email" className="w-full px-4 py-3 border border-border rounded-lg text-sm focus:outline-none focus:border-primary" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted mb-1.5 block">Phone</label>
            <input type="tel" placeholder="+91 98765 43210" className="w-full px-4 py-3 border border-border rounded-lg text-sm focus:outline-none focus:border-primary" />
          </div>
          <button className="w-full py-3 bg-primary text-white rounded-full font-semibold text-sm hover:bg-primary-dark transition-colors">
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
