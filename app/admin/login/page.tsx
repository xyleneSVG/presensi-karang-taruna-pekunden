'use client';

import { useState } from 'react';
import { loginAdmin } from '../hooks/action';
import { useRouter } from 'next/navigation';
import { Toaster, toast } from 'sonner';

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    
    const result = await loginAdmin(formData);
    
    if (result.success) {
      toast.success('Login Berhasil');
      router.push('/admin');
    } else {
      toast.error(result.message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-zinc-950 p-4">
      <Toaster position="top-center" />
      <div className="bg-white dark:bg-zinc-900 p-8 rounded-2xl shadow-xl w-full max-w-md border border-gray-200 dark:border-zinc-800">
        <h1 className="text-2xl font-bold mb-2 text-center text-gray-900 dark:text-white">Admin Access 🔒</h1>
        <p className="text-gray-500 text-center mb-6 text-sm">Masukkan password untuk melihat data presensi</p>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input 
              type="password" 
              name="password" 
              placeholder="Masukkan Password..." 
              className="w-full px-4 py-3 rounded-xl border bg-gray-50 dark:bg-zinc-800 dark:border-zinc-700 focus:ring-2 focus:ring-orange-500 outline-none transition-all"
              required 
            />
          </div>
          <button 
            disabled={loading}
            className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 rounded-xl transition-all disabled:opacity-50"
          >
            {loading ? 'Memproses...' : 'Masuk Dashboard'}
          </button>
        </form>
      </div>
    </div>
  );
}