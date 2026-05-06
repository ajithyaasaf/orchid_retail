'use client';

import { useAuthStore } from '@/stores/authStore';
import { User, LogOut, ShieldCheck, Mail, Phone, Calendar } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function ProfilePage() {
  const { user, logout } = useAuthStore();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  if (!user) return null;

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'var(--font-playfair)' }}>
          My Profile
        </h2>
        <button 
          onClick={handleLogout}
          className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 rounded-xl transition-colors"
        >
          <LogOut size={18} />
          Sign Out
        </button>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="md:col-span-2 bg-white border border-gray-100 shadow-sm rounded-2xl p-6 md:p-8">
          <div className="flex items-center gap-6 mb-8">
            <div className="w-20 h-20 rounded-2xl bg-primary flex items-center justify-center text-white shadow-lg shadow-primary/20">
              <span className="text-3xl font-bold">{user.name.charAt(0).toUpperCase()}</span>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-xl font-bold text-gray-900">{user.name}</h3>
                {user.role === 'admin' && (
                  <span className="flex items-center gap-1 px-2 py-0.5 bg-hero-bg/10 text-hero-bg text-[10px] font-bold rounded uppercase">
                    <ShieldCheck size={12} /> Admin
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-500">Managing your account since 2024</p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="grid sm:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Full Name</label>
                <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-xl border border-transparent focus-within:border-primary/20 transition-all">
                  <User size={18} className="text-gray-400" />
                  <span className="text-sm font-medium text-gray-700">{user.name}</span>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Email Address</label>
                <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-xl border border-transparent">
                  <Mail size={18} className="text-gray-400" />
                  <span className="text-sm font-medium text-gray-700">{user.email}</span>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Phone Number</label>
                <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-xl border border-transparent">
                  <Phone size={18} className="text-gray-400" />
                  <span className="text-sm font-medium text-gray-700">{user.phone || 'Not provided'}</span>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Joined Date</label>
                <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-xl border border-transparent">
                  <Calendar size={18} className="text-gray-400" />
                  <span className="text-sm font-medium text-gray-700">May 2024</span>
                </div>
              </div>
            </div>

            <div className="pt-4">
              <button className="px-8 py-3 bg-gray-900 text-white rounded-xl font-bold text-sm hover:bg-black transition-all shadow-md">
                Edit Profile
              </button>
            </div>
          </div>
        </div>

        {/* Info Card */}
        <div className="space-y-6">
          <div className="bg-hero-bg text-white rounded-2xl p-6 shadow-lg shadow-hero-bg/20">
            <h4 className="font-bold mb-2">Exclusive Benefits</h4>
            <p className="text-xs text-white/80 leading-relaxed mb-4">
              As a registered Orchid member, you get access to early sales, member-only discounts, and faster checkouts.
            </p>
            <div className="flex -space-x-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="w-8 h-8 rounded-full border-2 border-hero-bg bg-white/20" />
              ))}
              <div className="w-8 h-8 rounded-full border-2 border-hero-bg bg-white flex items-center justify-center text-hero-bg text-[10px] font-bold">
                +1k
              </div>
            </div>
          </div>
          
          <div className="bg-white border border-gray-100 rounded-2xl p-6">
            <h4 className="font-bold text-gray-900 mb-4">Account Security</h4>
            <button className="w-full text-left px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 rounded-xl transition-colors flex items-center justify-between group">
              Change Password
              <ArrowRight size={16} className="text-gray-300 group-hover:text-primary transition-colors" />
            </button>
            <button className="w-full text-left px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 rounded-xl transition-colors flex items-center justify-between group mt-1">
              Privacy Settings
              <ArrowRight size={16} className="text-gray-300 group-hover:text-primary transition-colors" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ArrowRight({ size, className }: { size: number, className?: string }) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <path d="M5 12h14m-7-7 7 7-7 7"/>
    </svg>
  );
}
