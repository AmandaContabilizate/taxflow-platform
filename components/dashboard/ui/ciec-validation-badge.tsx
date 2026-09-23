'use client';

import React, { useState } from 'react';
import { AlertCircle, CheckCircle2, Clock, KeyRound, Loader2, Pencil, RotateCw } from 'lucide-react';
import { validateTaxpayerCiec } from '@/features/taxpayers/actions/validateTaxpayerCiec.action';
import { useToast } from '@/hooks/use-toast';

export interface CiecValidationBadgeProps {
  /** RFC del contribuyente a validar o visualizar. */
  rfc: string;
  /** Estado actual de la CIEC: 1 Válida, 2 Inválida, 0 Sin Validar, null/undefined Sin CIEC. */
  ciecState?: number | null;
  /** Tamaño del control ('sm' para tablas compactas, 'md' para encabezados). */
  size?: 'sm' | 'md';
  /** Variante visual ('compact' con botón integrado o 'pill-only'). */
  variant?: 'compact' | 'pill-only';
  /** Callback opcional cuando el estado de la CIEC cambia tras la validación. */
  onStateChange?: (newCiecState: 0 | 1 | 2) => void;
  /** Callback opcional para abrir el modal de actualización de CIEC. */
  onOpenUpdateModal?: (rfc: string) => void;
  /** Clases CSS adicionales. */
  className?: string;
}

/**
 * Control interactivo minimalista y unificado para visualizar y validar bajo demanda la CIEC
 * contra el SAT. Mantiene una altura estricta de 1 sola línea con feedback contextual.
 */
export function CiecValidationBadge({
  rfc,
  ciecState,
  size = 'sm',
  variant = 'compact',
  onStateChange,
  onOpenUpdateModal,
  className = '',
}: CiecValidationBadgeProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [localState, setLocalState] = useState<number | null | undefined>(ciecState);

  // Sincronizar estado local si las props cambian externamente
  React.useEffect(() => {
    setLocalState(ciecState);
  }, [ciecState]);

  const handleValidate = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (loading || !rfc) return;

    setLoading(true);
    try {
      const res = await validateTaxpayerCiec({ rfc });
      if (res.success) {
        const nextState = res.value.ciecState;
        setLocalState(nextState);
        onStateChange?.(nextState);

        if (res.value.isValid) {
          toast({
            title: 'CIEC Válida',
            description: `La contraseña CIEC de ${rfc} fue validada exitosamente en el SAT.`,
          });
        } else {
          toast({
            variant: 'destructive',
            title: 'CIEC Inválida',
            description: `El portal del SAT rechazó la contraseña CIEC de ${rfc}.`,
          });
        }
      } else {
        toast({
          variant: 'destructive',
          title: 'Error de Validación',
          description: res.error.message || 'No se pudo conectar con el SAT.',
        });
      }
    } catch (err) {
      console.error('[CiecValidationBadge] Error:', err);
      toast({
        variant: 'destructive',
        title: 'Error inesperado',
        description: 'Ocurrió un error al intentar validar la CIEC.',
      });
    } finally {
      setLoading(false);
    }
  };

  const isSm = size === 'sm';
  const iconSize = isSm ? 12 : 13;
  const buttonIconSize = isSm ? 12 : 13;

  if (loading) {
    return (
      <div
        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-semibold border transition-all animate-pulse ${
          isSm ? 'text-[11px]' : 'text-[12px]'
        } bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800 ${className}`}
        title={`Validando contraseña CIEC de ${rfc} ante el SAT...`}
      >
        <Loader2 size={iconSize} className="animate-spin text-sky-600 dark:text-sky-400 shrink-0" />
        <span>Validando con SAT…</span>
      </div>
    );
  }

  // 1: Válida
  if (localState === 1) {
    return (
      <div className={`inline-flex items-center gap-1.5 whitespace-nowrap ${className}`}>
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-semibold border ${
            isSm ? 'text-[11px]' : 'text-[12px]'
          } bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800`}
          title="Contraseña CIEC confirmada y vigente en el SAT."
        >
          <CheckCircle2 size={iconSize} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>CIEC Válida</span>
        </span>

        {variant !== 'pill-only' && (
          <button
            type="button"
            onClick={handleValidate}
            className="p-1 rounded-full text-zinc-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 transition-all opacity-80 hover:opacity-100 hover:scale-110"
            title="Contraseña CIEC confirmada en el SAT. Clic para revalidar conexión"
            aria-label="Revalidar CIEC"
          >
            <RotateCw size={buttonIconSize} />
          </button>
        )}
      </div>
    );
  }

  // 2: Inválida (Píldora + Revalidar + Lápiz para actualizar)
  if (localState === 2) {
    return (
      <div className={`inline-flex items-center gap-1.5 whitespace-nowrap ${className}`}>
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-semibold border ${
            isSm ? 'text-[11px]' : 'text-[12px]'
          } bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800`}
          title="El SAT rechazó esta contraseña CIEC. Clic en el icono para revalidar si ya fue actualizada."
        >
          <AlertCircle size={iconSize} className="text-rose-600 dark:text-rose-400 shrink-0" />
          <span>CIEC Inválida</span>
        </span>

        {variant !== 'pill-only' && (
          <div className="inline-flex items-center gap-0.5">
            <button
              type="button"
              onClick={handleValidate}
              className="p-1 rounded-full text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/60 transition-all opacity-80 hover:opacity-100 hover:scale-110"
              title="El SAT rechazó esta contraseña CIEC. Clic para comprobar si ya funciona"
              aria-label="Revalidar CIEC"
            >
              <RotateCw size={buttonIconSize} />
            </button>

            {onOpenUpdateModal && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenUpdateModal(rfc);
                }}
                className="p-1 rounded-full text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/60 transition-all opacity-80 hover:opacity-100 hover:scale-110"
                title="Capturar y actualizar contraseña CIEC"
                aria-label="Actualizar contraseña CIEC"
              >
                <Pencil size={buttonIconSize} />
              </button>
            )}
          </div>
        )}
      </div>
    );
  }

  // 0: Sin Validar / Unverified
  if (localState === 0) {
    return (
      <div className={`inline-flex items-center gap-1.5 whitespace-nowrap ${className}`}>
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-semibold border ${
            isSm ? 'text-[11px]' : 'text-[12px]'
          } bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800`}
          title="Contraseña capturada pero aún no comprobada contra el SAT."
        >
          <Clock size={iconSize} className="text-amber-600 dark:text-amber-400 shrink-0" />
          <span>Sin Validar</span>
        </span>

        {variant !== 'pill-only' && (
          <button
            type="button"
            onClick={handleValidate}
            className="p-1 rounded-full text-zinc-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/60 transition-all opacity-80 hover:opacity-100 hover:scale-110"
            title="Contraseña sin verificar. Clic para validar contra el SAT ahora"
            aria-label="Validar CIEC"
          >
            <RotateCw size={buttonIconSize} />
          </button>
        )}
      </div>
    );
  }

  // Null / Undefined: Sin CIEC
  return (
    <div className={`inline-flex items-center gap-1.5 whitespace-nowrap ${className}`}>
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-semibold border ${
          isSm ? 'text-[11px]' : 'text-[12px]'
        } bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700`}
        title="El contribuyente no cuenta con contraseña CIEC registrada."
      >
        <KeyRound size={iconSize} className="text-zinc-400 shrink-0" />
        <span>Sin CIEC</span>
      </span>
    </div>
  );
}
