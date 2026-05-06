'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Mail, Lock, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';

function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, isLoading, error } = useAuthStore();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect') || '/';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await login(email, password);
    if (success) {
      router.push(redirectTo);
    }
  };

  return (
    <div className="w-full max-w-md">
      {/* Card */}
      <div className="bg-white rounded-3xl shadow-xl shadow-gray-100 border border-gray-100 overflow-hidden">
        <div className="p-8 md:p-10">
          <div className="text-center mb-10">
            <h1 className="text-3xl font-bold text-gray-900 mb-2" style={{ fontFamily: 'var(--font-playfair)' }}>
              Welcome Back
            </h1>
            <p className="text-gray-500 text-sm">Please enter your details to sign in</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 rounded-2xl flex items-start gap-3 text-red-600 text-sm animate-shake">
              <AlertCircle size={18} className="shrink-0 mt-0.5" />
              <p>{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wider ml-1">
                Email Address
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-primary transition-colors">
                  <Mail size={18} />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all outline-none text-sm"
                  placeholder="name@example.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center px-1">
                <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Password
                </label>
                <Link href="/forgot-password" className="text-xs font-semibold text-primary hover:underline">
                  Forgot?
                </Link>
              </div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-primary transition-colors">
                  <Lock size={18} />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all outline-none text-sm"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 bg-primary text-white rounded-2xl font-bold text-sm shadow-lg shadow-primary/20 hover:bg-primary-dark hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <Loader2 size={20} className="animate-spin" />
              ) : (
                <>
                  Sign In
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>
        </div>

        <div className="bg-gray-50 p-6 text-center border-t border-gray-100">
          <p className="text-gray-600 text-sm">
            Don't have an account?{' '}
            <Link href="/register" className="text-primary font-bold hover:underline">
              Sign Up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <Suspense fallback={<div className="text-center p-8">Loading...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
