'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

const loginSchema = z.object({
  email: z.string().email('Format email tidak valid'),
  password: z.string().min(1, 'Password wajib diisi'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  async function onSubmit(data: LoginFormData) {
    setIsLoading(true);
    setError('');

    try {
      const result = await signIn('credentials', {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      if (result?.error) {
        setError(result.error);
      } else {
        window.location.href = '/admin/dashboard';
        return;
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Terjadi kesalahan. Silakan coba lagi.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center relative overflow-hidden p-4"
      style={{
        background: 'linear-gradient(160deg, #0D0D0D 0%, #1A1A1A 50%, #111111 100%)',
      }}
    >
      {/* Subtle red accent glows */}
      <div
        className="absolute top-[-200px] left-1/2 -translate-x-1/2 w-[800px] h-[800px] rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse, rgba(227,6,19,0.06) 0%, transparent 70%)',
        }}
      />
      <div
        className="absolute bottom-[-300px] right-[-100px] w-[600px] h-[600px] rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse, rgba(227,6,19,0.04) 0%, transparent 70%)',
        }}
      />

      <div className="w-full max-w-[420px] relative z-10">
        {/* Logo & Brand */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-5">
            <img
              src="/images/karputindo-icon.png"
              alt="Karputindo Net"
              style={{ width: '80px', height: '80px', objectFit: 'contain', border: 'none', boxShadow: 'none' }}
            />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            KARPUTINDO <span style={{ color: '#E30613' }}>NET</span>
          </h1>
          <p className="text-gray-400 mt-1.5 text-sm">
            Customer Management System
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-2xl shadow-black/20 p-0 overflow-hidden">
          <div className="px-8 pt-7 pb-2">
            <h2 className="text-xl font-semibold text-gray-900">
              Masuk ke Akun Anda
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Masukkan email dan password untuk melanjutkan
            </p>
          </div>
          <div className="px-8 pb-8 pt-5">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-700 text-sm font-medium">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@karputindo.net"
                  {...register('email')}
                  disabled={isLoading}
                  className="h-11 border-gray-300 rounded-lg bg-gray-50/50 focus-visible:bg-white focus-visible:border-[#E30613] focus-visible:ring-[#E30613]/20 transition-all"
                />
                {errors.email && (
                  <p className="text-sm text-red-600">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-700 text-sm font-medium">
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Masukkan password"
                  {...register('password')}
                  disabled={isLoading}
                  className="h-11 border-gray-300 rounded-lg bg-gray-50/50 focus-visible:bg-white focus-visible:border-[#E30613] focus-visible:ring-[#E30613]/20 transition-all"
                />
                {errors.password && (
                  <p className="text-sm text-red-600">{errors.password.message}</p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full h-11 bg-[#E30613] hover:bg-[#B8000C] text-white font-semibold rounded-lg transition-all duration-200 shadow-sm hover:shadow-md cursor-pointer"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Memproses...
                  </>
                ) : (
                  'LOGIN'
                )}
              </Button>
            </form>
          </div>
        </div>

        <p className="text-center text-gray-600 text-xs mt-8">
          &copy; {new Date().getFullYear()} Karputindo Net. All rights reserved.
        </p>
      </div>
    </div>
  );
}
