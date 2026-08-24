'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
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
    <div className="min-h-screen flex items-center justify-center bg-[radial-gradient(circle_at_top,_#2a1115_0%,_#111318_42%,_#090a0c_100%)] p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-7">
          <div className="mx-auto mb-4 flex h-[86px] w-full max-w-[320px] items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] px-5 shadow-[0_18px_50px_rgba(0,0,0,0.35)]">
            <img
              src="/images/karputindo-logo-sidebar.png"
              alt="Karputindo Internet Service Provider"
              className="max-h-[70px] max-w-full object-contain"
            />
          </div>
          <h1 className="text-2xl font-bold tracking-[0.04em] text-white">
            KARPUTINDO <span className="text-[#C51F2A]">NET</span>
          </h1>
          <p className="mt-2 text-sm text-gray-400">
            Customer Management System
          </p>
        </div>

        <Card className="border border-white/10 bg-white shadow-2xl shadow-black/30">
          <CardHeader className="pb-4 pt-6 px-6">
            <h2 className="text-xl font-semibold text-[#171717]">
              Masuk ke Akun Anda
            </h2>
            <p className="text-sm text-muted-foreground">
              Masukkan email dan password untuk melanjutkan
            </p>
          </CardHeader>
          <CardContent className="px-6 pb-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@karputindo.net"
                  {...register('email')}
                  disabled={isLoading}
                  className="h-11 focus-visible:ring-[#C51F2A]"
                />
                {errors.email && (
                  <p className="text-sm text-destructive">
                    {errors.email.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Masukkan password"
                  {...register('password')}
                  disabled={isLoading}
                  className="h-11 focus-visible:ring-[#C51F2A]"
                />
                {errors.password && (
                  <p className="text-sm text-destructive">
                    {errors.password.message}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full h-11 bg-[#C51F2A] hover:bg-[#A71922] text-white font-semibold shadow-md shadow-[#C51F2A]/20"
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
          </CardContent>
        </Card>

        <p className="mt-6 text-center text-xs text-gray-500">
          &copy; {new Date().getFullYear()} Karputindo Net. All rights reserved.
        </p>
      </div>
    </div>
  );
}
