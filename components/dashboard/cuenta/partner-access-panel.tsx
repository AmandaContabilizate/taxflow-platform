'use client';

import { useState } from 'react';
import { AlertCircle, Ban, Check, Loader2, X } from 'lucide-react';
import { respondMyPartnerLink } from '@/features/partnership/actions/partnerTaxpayers.action';
import type { OwnerPartnerLink } from '@/features/partnership/types';
import { MONO } from '../constants';
import { Badge, Btn } from '../ui';

const fecha = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString('es-MX') : '—');

/**
 * Mi cuenta → Aliados con acceso: empresas aliadas que pueden ver/operar los RFC del cliente por la
 * Partner API, o que lo están pidiendo. El cliente acepta, rechaza o retira el acceso cuando quiera.
 */
export function PartnerAccessPanel({ links, onChanged }: { links: OwnerPartnerLink[]; onChanged: () => void }) {
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function act(link: OwnerPartnerLink, action: 'accept' | 'reject' | 'report' | 'revoke') {
    if (
      action === 'revoke' &&
      !window.confirm(`¿Retirar el acceso de ${link.partnerName} a tu RFC ${link.rfc}? Dejará de ver tu información de inmediato.`)
    )
      return;
    setBusy(`${link.linkId}:${action}`);
    setError(null);
    const res = await respondMyPartnerLink(link.linkId, action);
    setBusy(null);
    if (res.success) onChanged();
    else setError(res.error.message);
  }

  if (links.length === 0) {
    return (
      <p className='text-[13.5px]' style={{ color: 'var(--ink-500)' }}>
        Ninguna empresa aliada tiene acceso a tus RFC.
      </p>
    );
  }

  return (
    <div className='flex flex-col gap-3'>
      <p className='text-[12.5px]' style={{ color: 'var(--ink-500)' }}>
        Estas empresas pueden consultar tus RFC por medio de Contabilízate, o te pidieron permiso para hacerlo. Puedes
        retirar el acceso cuando quieras.
      </p>
      {error && (
        <div className='flex items-center gap-2 text-[13px] font-semibold' style={{ color: 'var(--violet-ink)' }}>
          <AlertCircle size={15} /> {error}
        </div>
      )}
      {links.map((l) => {
        const pending = l.status === 'pending_consent';
        return (
          <div
            key={l.linkId}
            className='rounded-xl px-4 py-3 flex flex-col gap-2'
            style={{ border: '1px solid var(--border)' }}>
            <div className='flex items-start justify-between gap-3'>
              <div className='min-w-0'>
                <div className='font-bold text-[14px]' style={{ color: 'var(--ink-900)' }}>{l.partnerName}</div>
                <div className='text-[12.5px]' style={{ color: 'var(--ink-500)' }}>
                  RFC <span style={MONO}>{l.rfc}</span> ·{' '}
                  {pending ? `solicitado el ${fecha(l.consentRequestedAt)}, vence el ${fecha(l.consentExpiresAt)}` : `con acceso desde ${fecha(l.activatedAt)}`}
                </div>
              </div>
              <Badge kind={pending ? 'amber' : 'brand'}>{pending ? 'Pendiente' : 'Con acceso'}</Badge>
            </div>
            <div className='flex gap-2 flex-wrap justify-end'>
              {pending ? (
                <>
                  <Btn kind='ghost' size='sm' onClick={() => act(l, 'report')} disabled={busy !== null}>
                    {busy === `${l.linkId}:report` ? <Loader2 size={14} className='animate-spin' /> : <AlertCircle size={14} />}
                    No la reconozco
                  </Btn>
                  <Btn kind='ghost' size='sm' onClick={() => act(l, 'reject')} disabled={busy !== null}>
                    {busy === `${l.linkId}:reject` ? <Loader2 size={14} className='animate-spin' /> : <X size={14} />}
                    Rechazar
                  </Btn>
                  <Btn kind='brand' size='sm' onClick={() => act(l, 'accept')} disabled={busy !== null}>
                    {busy === `${l.linkId}:accept` ? <Loader2 size={14} className='animate-spin' /> : <Check size={14} />}
                    Aceptar
                  </Btn>
                </>
              ) : (
                <Btn kind='ghost' size='sm' onClick={() => act(l, 'revoke')} disabled={busy !== null}>
                  {busy === `${l.linkId}:revoke` ? <Loader2 size={14} className='animate-spin' /> : <Ban size={14} />}
                  Retirar acceso
                </Btn>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
