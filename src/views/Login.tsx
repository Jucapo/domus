import { Loader2 } from 'lucide-react'
import { useState } from 'react'
import { useAuthStore } from '../store/useAuthStore'

export default function Login() {
  const signInWithGoogle = useAuthStore((s) => s.signInWithGoogle)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleGoogle = async () => {
    setSubmitting(true)
    setError(null)
    try {
      await signInWithGoogle()
      // El redirect lo maneja Supabase. Si falla, vuelve acá.
    } catch (err) {
      setError((err as Error)?.message || 'No se pudo iniciar sesión con Google.')
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
      <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-6 flex flex-col items-center gap-2 text-center">
          <img src="/logo.png" alt="Domus" className="h-14 w-14 object-contain" />
          <h1 className="text-xl font-bold tracking-tight text-slate-900">Domus</h1>
          <p className="text-sm text-slate-500">
            Inicia sesión para acceder al inventario de tu hogar.
          </p>
        </div>

        <button
          type="button"
          onClick={handleGoogle}
          disabled={submitting}
          className="flex w-full items-center justify-center gap-3 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50 disabled:opacity-60"
        >
          {submitting ? (
            <Loader2 size={18} className="animate-spin text-slate-500" />
          ) : (
            <GoogleIcon />
          )}
          Continuar con Google
        </button>

        {error ? (
          <p className="mt-3 text-center text-xs text-red-600">{error}</p>
        ) : null}
      </div>
    </div>
  )
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden>
      <path fill="#4285F4" d="M17.64 9.205c0-.638-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.614z"/>
      <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.181l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/>
      <path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"/>
      <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.892 11.426 0 9 0 5.48 0 2.438 2.017.957 4.958l3.007 2.332C4.672 5.163 6.656 3.58 9 3.58z"/>
    </svg>
  )
}
