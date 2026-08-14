'use client';

import { Bell, ChevronDown, ChevronRight, FilePlus2, Gem, HelpCircle, IdCard, LogOut, Receipt, ShieldCheck, UserRound } from 'lucide-react';
import { useEffect, useState, type ComponentType } from 'react';
import { useTheme } from 'next-themes';
import { getActivePlan } from '@/features/account/actions/getActivePlan.action';
import { getSalePayments } from '@/features/account/actions/getSalePayments.action';
import { periodLabel, type ActivePlan, type SalePayment } from '@/features/account/types';
import { getAccountantByRfc } from '@/features/assignments/actions/getAccountantByRfc.action';
import { useRfcStore } from '@/features/taxpayers/stores/rfcStore';
import SatConnectScreen from '@/components/sat-connect-screen';
import { Modal } from '../modal';
import { PaymentsPanel } from '../cuenta/payments-panel';
import { SecurityForm } from '../cuenta/security-form';
import { DISPLAY, MONO } from '../constants';
import type { GoFn } from '../types';
import { Btn, Card, Divider } from '../ui';

type ActionKey = 'seguridad' | 'pagos' | 'datos-fiscales';

interface PaymentsState {
  loading: boolean;
  error: string | null;
  items: SalePayment[];
  total: number;
}

const INITIAL_PAYMENTS: PaymentsState = { loading: true, error: null, items: [], total: 0 };

interface Props {
<<<<<<< HEAD
  fullName: string;
  email: string;
  rfc: string | null;
  role: string | null;
  initials: string;
  phoneNumber?: string;
  ciecState?: number;
  go: GoFn;
  onLogout: () => void;
  signingOut: boolean;
}

export function CuentaScreen({ fullName, email, rfc, role, initials, phoneNumber, ciecState, go, onLogout, signingOut }: Props) {
  const { theme, setTheme } = useTheme();
  const { selectedRfc } = useRfcStore();
  const [plan, setPlan] = useState<ActivePlan | null>(null);
=======
  fullName: string
  email: string
  rfc: string | null
  role: string | null
  initials: string
  phoneNumber?: string
  ciecState?: number
  isClient?: boolean
  go: GoFn
  onLogout: () => void
  signingOut: boolean
}

export function CuentaScreen({ fullName, email, rfc, role, initials, phoneNumber, ciecState, isClient = true, go, onLogout, signingOut }: Props) {
  const { theme, setTheme } = useTheme()
  const { selectedRfc } = useRfcStore()
  const [plan, setPlan] = useState<ActivePlan | null>(null)
>>>>>>> origin/dev
  const [accountant, setAccountant] = useState<{ loading: boolean; name: string | null }>({
    loading: true,
    name: null,
  });
  const [payments, setPayments] = useState<PaymentsState>(INITIAL_PAYMENTS);
  const [active, setActive] = useState<ActionKey | null>(null);
  const [showFiscalModal, setShowFiscalModal] = useState(false);
  const [showSecurityModal, setShowSecurityModal] = useState(false);

  const activeRfc = selectedRfc ?? rfc;
  const [pushPermission, setPushPermission] = useState<string>('default');

  useEffect(() => {
<<<<<<< HEAD
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPushPermission(Notification.permission);
    }
  }, []);

  const handleRequestPush = async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      alert('Tu navegador no soporta notificaciones push.');
      return;
    }
    const perm = await Notification.requestPermission();
    setPushPermission(perm);
    if (perm === 'granted') {
      alert('¡Notificaciones activadas con éxito en este dispositivo!');
    } else if (perm === 'denied') {
      alert('Las notificaciones fueron bloqueadas en los ajustes de tu navegador.');
    }
  };

  useEffect(() => {
    if (!activeRfc) return;
    let cancelled = false;
    setAccountant({ loading: true, name: null });
    setPayments(INITIAL_PAYMENTS);
=======
    if (!isClient || !activeRfc) return
    let cancelled = false
    setAccountant({ loading: true, name: null })
    setPayments(INITIAL_PAYMENTS)
>>>>>>> origin/dev

    void (async () => {
      const [planRes, accRes, payRes] = await Promise.all([getActivePlan(activeRfc), getAccountantByRfc(activeRfc), getSalePayments(activeRfc, 1, 50)]);
      if (cancelled) return;
      if (planRes.success) setPlan(planRes.value);
      setAccountant({ loading: false, name: accRes.success ? accRes.value.accountantName : null });
      setPayments(payRes.success ? { loading: false, error: null, items: payRes.value.items, total: payRes.value.total } : { loading: false, error: payRes.error.message, items: [], total: 0 });
    })();

    return () => {
<<<<<<< HEAD
      cancelled = true;
    };
  }, [activeRfc]);
=======
      cancelled = true
    }
  }, [activeRfc, isClient])
>>>>>>> origin/dev

  const planLabel = plan?.hasPlan ? `${plan.planName ?? 'Tu plan'}${plan.billingPeriod ? ` · ${periodLabel(plan.billingPeriod)}` : ''}` : 'Sin plan activo';

  const accountantLabel = accountant.loading ? 'Cargando…' : (accountant.name ?? 'Sin contador asignado');
  const paymentsLabel = payments.loading ? 'Cargando…' : payments.error ? 'No disponible' : payments.total > 0 ? `${payments.total} ${payments.total === 1 ? 'pago' : 'pagos'}` : 'Sin pagos registrados';

  const toggle = (key: ActionKey) => setActive((cur) => (cur === key ? null : key));

  const detail =
    active === 'pagos' ? (
      <PaymentsPanel
        loading={payments.loading}
        error={payments.error}
        items={payments.items}
        total={payments.total}
      />
    ) : null;

  return (
    <div className={`flex flex-col gap-7 items-start w-full ${active === 'datos-fiscales' ? 'lg:flex-row' : 'lg:flex-row'}`}>
      {/* Perfil */}
      <div className='w-full lg:w-[310px] lg:shrink-0 flex flex-col gap-6'>
        <Card>
          <div className='p-6'>
            <div className='flex items-center gap-4'>
              <div
                className='w-[60px] h-[60px] rounded-full flex items-center justify-center text-white text-[24px] font-extrabold flex-shrink-0'
                style={{ ...DISPLAY, background: 'linear-gradient(135deg,#10DA92,#00B073)' }}>
                {initials}
              </div>
              <div className='min-w-0'>
                <div
                  className='text-[19px] font-extrabold tracking-tight truncate'
                  style={DISPLAY}>
                  {fullName}
                </div>
                {isClient && activeRfc && (
                  <div
                    className='text-[12px] mt-0.5 truncate'
                    style={{ ...MONO, color: 'var(--ink-500)' }}>
                    {activeRfc}
                  </div>
                )}
              </div>
            </div>

            <div
              className='text-[12.5px] mt-3 truncate'
              style={{ color: 'var(--ink-500)' }}>
              {email}
            </div>

            {phoneNumber && (
              <div
                className='text-[12.5px] mt-2 truncate flex items-center gap-2'
                style={{ color: 'var(--ink-500)' }}>
                <span>📱</span>
                <span style={{ color: 'var(--ink-700)' }}>{phoneNumber}</span>
              </div>
            )}

            {role && (
              <div
                className='inline-flex mt-2 px-2.5 py-1 rounded-full text-[11px] font-bold'
                style={{ background: 'var(--ink-50)', color: 'var(--ink-700)' }}>
                {role}
              </div>
            )}

            {isClient && (
              <>
                <Divider />

                <div className='flex items-center justify-between gap-3 pt-1'>
                  <div className='min-w-0'>
                    <div
                      className='text-[11px] font-extrabold uppercase tracking-wider'
                      style={{ color: 'var(--ink-500)' }}>
                      Mi plan
                    </div>
                    <div
                      className='text-[14.5px] font-bold mt-0.5 truncate'
                      style={{ color: 'var(--ink-900)' }}>
                      {planLabel}
                    </div>
                  </div>
                  <Btn
                    size='sm'
                    kind='primary'
                    onClick={() => go('plan')}>
                    Gestionar
                  </Btn>
                </div>
              </>
            )}
          </div>
        </Card>

        {isClient && (
        <Card>
          <div className='p-6'>
            <div
              className='text-[11px] font-extrabold uppercase tracking-wider mb-2'
              style={{ color: 'var(--ink-500)' }}>
              Estado de CIEC
            </div>
            <div className='flex items-center justify-between'>
              <div>
                <div
                  className='text-[15px] font-bold'
                  style={{ color: 'var(--ink-900)' }}>
                  {ciecState === 1 ? 'Válida' : ciecState === 2 ? 'Inválida' : 'No validado'}
                </div>
                <div
                  className='text-[12px] mt-1'
                  style={{ color: 'var(--ink-500)' }}>
                  {ciecState === 1 ? 'Tu contraseña CIEC es válida' : ciecState === 2 ? 'Tu contraseña CIEC es inválida' : 'Aún no has validado tu CIEC'}
                </div>
              </div>
              <div
                className='w-12 h-12 rounded-full flex items-center justify-center text-[20px]'
                style={{
                  background: ciecState === 1 ? 'var(--brand-50)' : ciecState === 2 ? 'var(--coral-soft)' : 'var(--amber-soft)',
                  color: ciecState === 1 ? 'var(--brand-700)' : ciecState === 2 ? '#9E3A15' : '#7B5312',
                }}>
                {ciecState === 1 ? '✓' : ciecState === 2 ? '✕' : '!'}
              </div>
            </div>
          </div>
        </Card>
        )}
      </div>

      {/* Listas */}
      <div className='flex-1 min-w-0 w-full flex flex-col gap-6'>
        {isClient && (
        <Section title='Gestión'>
          <Card>
            <AccountRow
              Icon={Gem}
              iconBg='var(--brand-50)'
              iconColor='var(--brand-700)'
              title='Mi plan'
              subtitle={planLabel}
              onClick={() => {
                go('plan');
                toggle('datos-fiscales');
              }}
            />
            <Divider />
            <AccountRow
              Icon={FilePlus2}
              iconBg='var(--coral-soft)'
              iconColor='#9E3A15'
              title='Trámites adicionales'
              subtitle='Trámites con el SAT y declaraciones extra'
              onClick={() => {
                go('tramites');
                toggle('datos-fiscales');
              }}
            />
            <Divider />
            <AccountRow
              Icon={IdCard}
              iconBg='var(--sky-soft)'
              iconColor='#1C4C96'
              title='Datos fiscales'
              subtitle={activeRfc ? `RFC ${activeRfc}` : 'RFC · régimen · domicilio'}
              onClick={() => setShowFiscalModal(true)}
              right={
                <ChevronDown
                  size={16}
                  style={{
                    color: 'var(--ink-300)',
                    transition: 'transform 0.2s',
                    transform: 'rotate(-90deg)',
                  }}
                />
              }
            />
            <Divider />
            <AccountRow
              Icon={UserRound}
              iconBg='var(--violet-soft)'
              iconColor='#5A4DCC'
              title='Tu contador asignado'
              subtitle={accountantLabel}
            />
            <Divider />
            <AccountRow
              Icon={Receipt}
              iconBg='var(--amber-soft)'
              iconColor='#7B5312'
              title='Mis pagos a Contabilízate'
              subtitle={paymentsLabel}
              onClick={() => toggle('pagos')}
              right={
                <ChevronDown
                  size={16}
                  style={{
                    color: 'var(--ink-300)',
                    transition: 'transform 0.2s',
                    transform: active === 'pagos' ? 'rotate(180deg)' : 'none',
                  }}
                />
              }
            />
            {active === 'pagos' && (
              <div className='lg:hidden px-4 pb-5 pt-1'>
                <PaymentsPanel
                  loading={payments.loading}
                  error={payments.error}
                  items={payments.items}
                  total={payments.total}
                />
              </div>
            )}
          </Card>
        </Section>
        )}

        <Section title='Preferencias'>
          <Card>
            <AccountRow
              Icon={Bell}
              title='Notificaciones'
              subtitle={
                pushPermission === 'granted'
                  ? 'Activadas en este dispositivo'
                  : pushPermission === 'denied'
                  ? 'Bloqueadas en el navegador'
                  : 'Toca para activar en este dispositivo'
              }
              onClick={handleRequestPush}
              right={
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                  pushPermission === 'granted'
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                    : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                }`}>
                  {pushPermission === 'granted' ? 'Activado' : 'Activar'}
                </span>
              }
            />
            <Divider />
            <AccountRow
              Icon={ShieldCheck}
              title='Seguridad'
              subtitle='Cambia tu contraseña'
              onClick={() => setShowSecurityModal(true)}
              right={
                <ChevronDown
                  size={16}
                  style={{
                    color: 'var(--ink-300)',
                    transition: 'transform 0.2s',
                    transform: 'rotate(-90deg)',
                  }}
                />
              }
            />
            <Divider />
            <AccountRow
              Icon={HelpCircle}
              title='Centro de ayuda'
              subtitle='FAQ · chat humano'
              onClick={() => go('ayuda')}
            />
          </Card>
        </Section>

        <Btn
          block
          kind='ghost'
          onClick={signingOut ? undefined : onLogout}
          disabled={signingOut}
          style={{ color: '#B01F1F', borderColor: 'var(--danger-soft)' }}>
          <LogOut size={16} /> {signingOut ? 'Cerrando sesión…' : 'Cerrar sesión'}
        </Btn>

        <div
          className='text-center text-[11px] font-semibold'
          style={{ color: 'var(--ink-400)' }}>
          Contabilízate · Hecho con cariño en México
        </div>
      </div>

      {/* Detalle de acción (desktop) */}
      {detail && (
        <div className='hidden lg:block lg:w-[360px] lg:shrink-0'>
          <Card>
            <div className='p-5'>{detail}</div>
          </Card>
        </div>
      )}

      {/* Modal de Datos Fiscales */}
      <Modal
        isOpen={showFiscalModal}
        onClose={() => setShowFiscalModal(false)}
        title='Datos fiscales'>
        <SatConnectScreen rfc={activeRfc} />
      </Modal>

      {/* Modal de Seguridad */}
      <Modal
        isOpen={showSecurityModal}
        onClose={() => setShowSecurityModal(false)}
        title='Seguridad'>
        <SecurityForm />
      </Modal>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div
        className='text-[11px] font-extrabold uppercase tracking-wider mb-2.5 px-1'
        style={{ color: 'var(--ink-500)' }}>
        {title}
      </div>
      {children}
    </div>
  );
}

interface AccountRowProps {
  Icon: ComponentType<{ size?: number }>;
  title: string;
  subtitle: string;
  iconBg?: string;
  iconColor?: string;
  onClick?: () => void;
  right?: React.ReactNode;
}

function AccountRow({ Icon, title, subtitle, iconBg, iconColor, onClick, right }: AccountRowProps) {
  const content = (
    <>
      <div
        className='w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0'
        style={{ background: iconBg ?? 'var(--ink-50)', color: iconColor ?? 'var(--ink-700)' }}>
        <Icon size={18} />
      </div>
      <div className='flex-1 min-w-0'>
        <div className='font-bold text-[14.5px]'>{title}</div>
        <div
          className='text-[12.5px] mt-0.5 truncate'
          style={{ color: 'var(--ink-500)' }}>
          {subtitle}
        </div>
      </div>
      {onClick
        ? (right ?? (
            <ChevronRight
              size={16}
              style={{ color: 'var(--ink-300)' }}
            />
          ))
        : null}
    </>
  );

  if (!onClick) {
    return <div className='w-full px-4 py-3.5 flex items-center gap-3'>{content}</div>;
  }

  return (
    <button
      type='button'
      onClick={onClick}
      className='w-full px-4 py-3.5 flex items-center gap-3 text-left transition hover:bg-[var(--ink-50)]'>
      {content}
    </button>
  );
}
