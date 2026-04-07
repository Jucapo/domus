import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Loader2 } from 'lucide-react'

/**
 * Bloquea la pantalla (clicks y scroll) mientras dura una operación larga.
 * @param {object} props
 * @param {boolean} props.open
 * @param {string} props.title
 * @param {string} [props.message]
 * @param {boolean} [props.indeterminate] — sin porcentaje (barra animada)
 * @param {number} [props.progress] — 0–100 cuando no es indeterminado
 */
export default function BlockingLoadingOverlay({
  open,
  title,
  message,
  indeterminate = false,
  progress,
}) {
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  if (!open) return null

  const pct = Math.min(
    100,
    Math.max(0, Math.round(Number(progress ?? 0) || 0)),
  )
  const showBar = indeterminate || typeof progress === 'number'

  const node = (
    <div
      className="fixed inset-0 z-[100] flex touch-none items-center justify-center bg-slate-900/45 p-4 backdrop-blur-[1px]"
      role="alertdialog"
      aria-modal="true"
      aria-busy="true"
      aria-live="polite"
      aria-label={title}
    >
      <div className="w-full max-w-sm rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xl">
        <div className="flex gap-4">
          <Loader2
            className="h-9 w-9 shrink-0 animate-spin text-violet-600"
            aria-hidden
          />
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-slate-900">{title}</p>
            {message ? (
              <p className="mt-1 text-sm leading-snug text-slate-600">{message}</p>
            ) : null}
            {showBar ? (
              <div className="mt-4">
                <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
                  {indeterminate ? (
                    <div
                      className="absolute left-0 top-0 h-full w-[38%] rounded-full bg-violet-600"
                      style={{ animation: 'blocking-bar-slide 1.2s ease-in-out infinite' }}
                    />
                  ) : (
                    <div
                      className="h-full rounded-full bg-violet-600 transition-[width] duration-150 ease-out"
                      style={{ width: `${pct}%` }}
                    />
                  )}
                </div>
                {!indeterminate ? (
                  <p className="mt-2 text-right text-xs tabular-nums text-slate-500">{pct}%</p>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
      </div>
      <style>{`
        @keyframes blocking-bar-slide {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(280%);
          }
        }
      `}</style>
    </div>
  )

  return createPortal(node, document.body)
}
