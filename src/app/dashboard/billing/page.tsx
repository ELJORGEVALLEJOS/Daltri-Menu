'use client';
import { useEffect, useMemo, useState } from 'react';
import { CardPayment, initMercadoPago } from '@mercadopago/sdk-react';
import { Button } from '@/components/ui/button';
import {
    AUTH_REQUIRED_ERROR,
    cancelSubscription,
    fetchBillingHistory,
    fetchBillingOverview,
    resumeBillingSubscription,
    resumeBillingSubscriptionWithCurrentCard,
    retryBillingPayment,
    startBillingTrial,
    updateSubscriptionPaymentMethod,
    type MerchantBillingHistoryResponse,
    type MerchantBillingOverview,
    type MerchantSubscription,
} from '@/lib/admin-api';
import { formatMoney } from '@/lib/format';
import { useRouter } from 'next/navigation';

const mpPublicKey = process.env.NEXT_PUBLIC_MP_PUBLIC_KEY?.trim();
if (mpPublicKey) {
    initMercadoPago(mpPublicKey);
}

type BillingActionMode = 'start' | 'retry' | 'update' | 'resume';

function formatBillingDate(value?: string | null) {
    if (!value) return 'Sin fecha';
    return new Intl.DateTimeFormat('es-AR', {
        dateStyle: 'medium',
    }).format(new Date(value));
}

function getBillingStatusMeta(status?: MerchantSubscription['status'] | null) {
    switch (status) {
        case 'TRIALING':
            return { label: 'Prueba gratuita', tone: 'bg-blue-100 text-blue-700' };
        case 'ACTIVE':
            return { label: 'Activa', tone: 'bg-emerald-100 text-emerald-700' };
        case 'PAST_DUE':
            return { label: 'Pendiente de cobro', tone: 'bg-amber-100 text-amber-700' };
        case 'PAUSED':
            return { label: 'Pausada', tone: 'bg-amber-100 text-amber-700' };
        case 'INCOMPLETE':
            return { label: 'Incompleta', tone: 'bg-red-100 text-red-700' };
        case 'CANCEL_SCHEDULED':
            return { label: 'Cancelación programada', tone: 'bg-slate-200 text-slate-700' };
        case 'CANCELLED':
            return { label: 'Cancelada', tone: 'bg-slate-200 text-slate-700' };
        default:
            return { label: 'Pendiente', tone: 'bg-slate-200 text-slate-700' };
    }
}

function getActionMode(overview: MerchantBillingOverview | null): BillingActionMode | null {
    if (!overview) return null;
    if (overview.actions.can_start_trial) return 'start';
    if (overview.actions.can_retry_payment) return 'retry';
    if (overview.actions.can_resume) return 'resume';
    if (overview.actions.can_update_card && overview.subscription?.status !== 'CANCELLED') {
        return 'update';
    }
    return null;
}

export default function BillingPage() {
    const router = useRouter();
    const [overview, setOverview] = useState<MerchantBillingOverview | null>(null);
    const [history, setHistory] = useState<MerchantBillingHistoryResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [cancelling, setCancelling] = useState(false);
    const [polling, setPolling] = useState(false);
    const [actionMode, setActionMode] = useState<BillingActionMode | null>(null);
    const [showCardForm, setShowCardForm] = useState(false);

    const planAmount = useMemo(() => {
        if (overview?.subscription?.plan?.amount_cents) {
            return Math.max(1, overview.subscription.plan.amount_cents / 100);
        }

        if (overview?.offer?.amount_cents) {
            return Math.max(1, overview.offer.amount_cents / 100);
        }

        return 1;
    }, [overview]);

    const payerEmail = overview?.subscription?.payer_email || undefined;
    const hasStoredCard = Boolean(overview?.subscription?.card_last_four);

    const loadBilling = async () => {
        setLoading(true);
        setError('');

        try {
            const [billingOverview, billingHistory] = await Promise.all([
                fetchBillingOverview(),
                fetchBillingHistory(),
            ]);
            setOverview(billingOverview);
            setHistory(billingHistory);
            setActionMode(getActionMode(billingOverview));
        } catch (loadError) {
            if (loadError instanceof Error && loadError.message === AUTH_REQUIRED_ERROR) {
                router.replace('/login');
                return;
            }

            setError(loadError instanceof Error ? loadError.message : 'No se pudo cargar la facturación.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void loadBilling();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (!actionMode) {
            setShowCardForm(false);
            return;
        }

        if (actionMode === 'start' || actionMode === 'retry') {
            setShowCardForm(true);
            return;
        }

        if (actionMode === 'resume' && !hasStoredCard) {
            setShowCardForm(true);
            return;
        }

        setShowCardForm(false);
    }, [actionMode, hasStoredCard]);

    const pollUntilResolved = async () => {
        setPolling(true);

        try {
            for (let attempt = 0; attempt < 4; attempt += 1) {
                await new Promise((resolve) => window.setTimeout(resolve, 2500));
                const nextOverview = await fetchBillingOverview();
                setOverview(nextOverview);
                setActionMode(getActionMode(nextOverview));
                if (!nextOverview.processing && !nextOverview.blocked) {
                    break;
                }
            }

            const nextHistory = await fetchBillingHistory();
            setHistory(nextHistory);
        } catch (pollError) {
            if (pollError instanceof Error && pollError.message === AUTH_REQUIRED_ERROR) {
                router.replace('/login');
                return;
            }

            setError(pollError instanceof Error ? pollError.message : 'No se pudo sincronizar el estado del pago.');
        } finally {
            setPolling(false);
        }
    };

    const handleCardAction = async (payload: {
        mp_card_token: string;
        mp_payment_method_id?: string;
        mp_payment_type_id?: string;
        mp_card_last_four?: string;
        mp_cardholder_name?: string;
    }) => {
        if (!actionMode) {
            return;
        }

        setSubmitting(true);
        setError('');
        setSuccess('');

        try {
            const nextOverview =
                actionMode === 'start'
                    ? await startBillingTrial(payload)
                    : actionMode === 'retry'
                      ? await retryBillingPayment(payload)
                      : actionMode === 'resume'
                        ? await resumeBillingSubscription(payload)
                      : await updateSubscriptionPaymentMethod(payload);

            if ('blocked' in nextOverview) {
                setOverview(nextOverview);
                setActionMode(getActionMode(nextOverview));
                if (nextOverview.processing) {
                    setSuccess('Estamos confirmando el pago con Mercado Pago...');
                    await pollUntilResolved();
                } else {
                    setSuccess(
                        actionMode === 'start'
                            ? 'La prueba gratuita quedó iniciada.'
                            : actionMode === 'retry'
                              ? 'Se actualizó la tarjeta y se reintentó el cobro.'
                              : actionMode === 'resume'
                                ? 'La suscripción volvió a quedar activa.'
                              : 'La tarjeta quedó actualizada.',
                    );
                    setShowCardForm(false);
                    const nextHistory = await fetchBillingHistory();
                    setHistory(nextHistory);
                }
            } else {
                setOverview((current) =>
                    current
                        ? {
                              ...current,
                              subscription: nextOverview,
                          }
                        : current,
                );
                setSuccess('La tarjeta quedó actualizada.');
                const nextHistory = await fetchBillingHistory();
                setHistory(nextHistory);
            }
        } catch (actionError) {
            if (actionError instanceof Error && actionError.message === AUTH_REQUIRED_ERROR) {
                router.replace('/login');
                return;
            }

            setError(actionError instanceof Error ? actionError.message : 'No se pudo procesar la acción de facturación.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleResumeWithCurrentCard = async () => {
        setSubmitting(true);
        setError('');
        setSuccess('');

        try {
            const nextOverview = await resumeBillingSubscriptionWithCurrentCard();
            setOverview(nextOverview);
            setActionMode(getActionMode(nextOverview));

            if (nextOverview.processing) {
                setSuccess('Estamos confirmando la reactivación con Mercado Pago...');
                await pollUntilResolved();
            } else {
                setSuccess('La suscripción volvió a quedar activa.');
                const nextHistory = await fetchBillingHistory();
                setHistory(nextHistory);
            }
        } catch (resumeError) {
            if (resumeError instanceof Error && resumeError.message === AUTH_REQUIRED_ERROR) {
                router.replace('/login');
                return;
            }

            setError(
                resumeError instanceof Error
                    ? resumeError.message
                    : 'No se pudo reanudar la suscripción con la tarjeta actual.',
            );
        } finally {
            setSubmitting(false);
        }
    };

    const handleCancel = async () => {
        if (!overview?.subscription || cancelling) {
            return;
        }

        setCancelling(true);
        setError('');
        setSuccess('');

        try {
            await cancelSubscription();
            await loadBilling();
            setSuccess('La renovación del plan quedó cancelada.');
        } catch (cancelError) {
            if (cancelError instanceof Error && cancelError.message === AUTH_REQUIRED_ERROR) {
                router.replace('/login');
                return;
            }

            setError(cancelError instanceof Error ? cancelError.message : 'No se pudo cancelar la renovación.');
        } finally {
            setCancelling(false);
        }
    };

    if (loading) {
        return <div className="rounded-2xl border bg-white p-6 text-sm font-medium text-gray-500">Cargando facturación...</div>;
    }

    const currentStatus = overview?.subscription?.status;
    const statusMeta = getBillingStatusMeta(currentStatus);
    const billingTitle =
        overview?.subscription?.plan?.name || overview?.offer?.name || 'Plan comercial';

    return (
        <div className="space-y-6">
            <section className="rounded-2xl border bg-white p-5 sm:p-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-3">
                            <h1 className="text-2xl font-bold text-gray-950">Facturación</h1>
                            <span className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] ${statusMeta.tone}`}>
                                {overview?.block_reason === 'NO_SETUP' ? 'Pendiente de activación' : statusMeta.label}
                            </span>
                        </div>
                        <p className="text-sm font-medium text-gray-600">
                            Administra tu plan, tarjeta y estado de cobro desde un solo lugar.
                        </p>
                    </div>
                    <Button type="button" variant="outline" onClick={() => void loadBilling()}>
                        Actualizar estado
                    </Button>
                </div>

                {error && (
                    <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                        {error}
                    </div>
                )}
                {success && (
                    <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
                        {success}
                    </div>
                )}

                <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                        <p className="text-xs font-bold uppercase tracking-[0.18em] text-gray-500">Plan</p>
                        <p className="mt-2 text-base font-bold text-gray-950">{billingTitle}</p>
                        <p className="mt-1 text-sm font-medium text-gray-700">
                            {formatMoney(planAmount)} / mes
                        </p>
                    </div>
                    <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                        <p className="text-xs font-bold uppercase tracking-[0.18em] text-gray-500">Fin de prueba</p>
                        <p className="mt-2 text-base font-bold text-gray-950">
                            {formatBillingDate(overview?.subscription?.trial_ends_at)}
                        </p>
                        <p className="mt-1 text-sm font-medium text-gray-700">
                            {overview?.subscription?.plan?.trial_days ?? overview?.offer?.trial_days ?? 14} días gratis
                        </p>
                    </div>
                    <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                        <p className="text-xs font-bold uppercase tracking-[0.18em] text-gray-500">
                            Próximo cobro
                        </p>
                        <p className="mt-2 text-base font-bold text-gray-950">
                            {formatBillingDate(
                                overview?.subscription?.cancellation_effective_at ||
                                    overview?.subscription?.next_billing_at,
                            )}
                        </p>
                        <p className="mt-1 text-sm font-medium text-gray-700">
                            {currentStatus === 'CANCEL_SCHEDULED'
                                ? 'El acceso se mantiene hasta esa fecha.'
                                : 'Mercado Pago realizará el débito automático.'}
                        </p>
                    </div>
                    <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                        <p className="text-xs font-bold uppercase tracking-[0.18em] text-gray-500">Tarjeta</p>
                        <p className="mt-2 text-base font-bold text-gray-950">
                            {overview?.subscription?.card_last_four
                                ? `Terminada en ${overview.subscription.card_last_four}`
                                : 'Sin tarjeta registrada'}
                        </p>
                        <p className="mt-1 text-sm font-medium text-gray-700">
                            {overview?.subscription?.first_payment_at
                                ? `Primer cobro: ${formatBillingDate(overview.subscription.first_payment_at)}`
                                : 'Aún no se registró el primer cobro.'}
                        </p>
                    </div>
                </div>

                {overview?.support_message && (
                    <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">
                        {overview.support_message}
                    </div>
                )}
            </section>

            <section className="grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
                <div className="space-y-6 rounded-2xl border bg-white p-5 sm:p-6">
                    <div>
                        <h2 className="text-lg font-bold text-gray-950">Acción principal</h2>
                        <p className="mt-1 text-sm font-medium text-gray-600">
                            {actionMode === 'start'
                                ? 'Inicia la prueba gratuita y habilita el negocio registrando la tarjeta.'
                                : actionMode === 'retry'
                                  ? 'Actualiza la tarjeta para regularizar el cobro y volver a operar.'
                                  : actionMode === 'resume'
                                    ? hasStoredCard
                                        ? 'Reanuda la suscripción con la tarjeta ya registrada o agrega un medio de pago nuevo.'
                                        : 'Registra una tarjeta para reactivar la suscripción y volver a dejar el cobro automático activo.'
                                  : actionMode === 'update'
                                    ? hasStoredCard
                                        ? 'Tu tarjeta ya está guardada. Si quieres cambiarla, agrega un medio de pago nuevo.'
                                        : 'Registra una tarjeta para que Mercado Pago cobre la suscripción.'
                                    : 'Tu plan no requiere una acción inmediata.'}
                        </p>
                    </div>

                    {actionMode && mpPublicKey ? (
                        showCardForm ? (
                            <div className="space-y-4">
                                {(actionMode === 'update' || (actionMode === 'resume' && hasStoredCard)) && (
                                    <div className="flex flex-wrap gap-3">
                                        {actionMode === 'resume' && hasStoredCard && (
                                            <Button
                                                type="button"
                                                onClick={() => void handleResumeWithCurrentCard()}
                                                disabled={submitting || polling}
                                            >
                                                {submitting ? 'Reanudando...' : 'Reanudar suscripción'}
                                            </Button>
                                        )}
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => setShowCardForm(false)}
                                            disabled={submitting || polling}
                                        >
                                            Cancelar
                                        </Button>
                                    </div>
                                )}
                                <CardPayment
                                    initialization={{
                                        amount: planAmount,
                                        ...(payerEmail ? { payer: { email: payerEmail } } : {}),
                                    }}
                                    customization={{
                                        paymentMethods: {
                                            minInstallments: 1,
                                            maxInstallments: 1,
                                        },
                                    }}
                                    locale="es-AR"
                                    onSubmit={async (paymentFormData, additionalData) => {
                                        await handleCardAction({
                                            mp_card_token: paymentFormData.token,
                                            mp_payment_method_id: paymentFormData.payment_method_id,
                                            mp_payment_type_id:
                                                additionalData?.paymentTypeId || undefined,
                                            mp_card_last_four:
                                                additionalData?.lastFourDigits || undefined,
                                            mp_cardholder_name:
                                                additionalData?.cardholderName || undefined,
                                        });
                                    }}
                                    onError={(brickError) => {
                                        const message =
                                            typeof brickError?.message === 'string' && brickError.message.trim()
                                                ? brickError.message
                                                : 'No se pudo cargar el formulario de tarjeta.';
                                        setError(message);
                                    }}
                                />
                            </div>
                        ) : actionMode === 'resume' && hasStoredCard ? (
                            <div className="space-y-4 rounded-2xl border border-gray-100 bg-gray-50 p-4">
                                <p className="text-sm font-medium text-gray-700">
                                    Usaremos la tarjeta terminada en{' '}
                                    <span className="font-bold text-gray-950">{overview?.subscription?.card_last_four}</span>{' '}
                                    para reactivar la suscripción.
                                </p>
                                <div className="flex flex-wrap gap-3">
                                    <Button
                                        type="button"
                                        onClick={() => void handleResumeWithCurrentCard()}
                                        disabled={submitting || polling}
                                    >
                                        {submitting ? 'Reanudando...' : 'Reanudar suscripción'}
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setShowCardForm(true)}
                                        disabled={submitting || polling}
                                    >
                                        Agregar medio de pago
                                    </Button>
                                </div>
                            </div>
                        ) : actionMode === 'update' && hasStoredCard ? (
                            <div className="space-y-4 rounded-2xl border border-gray-100 bg-gray-50 p-4">
                                <p className="text-sm font-medium text-gray-700">
                                    Hoy Mercado Pago cobrará con la tarjeta terminada en{' '}
                                    <span className="font-bold text-gray-950">{overview?.subscription?.card_last_four}</span>.
                                </p>
                                <div className="flex flex-wrap gap-3">
                                    <Button
                                        type="button"
                                        onClick={() => setShowCardForm(true)}
                                        disabled={submitting || polling}
                                    >
                                        Agregar medio de pago
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <CardPayment
                                initialization={{
                                    amount: planAmount,
                                    ...(payerEmail ? { payer: { email: payerEmail } } : {}),
                                }}
                                customization={{
                                    paymentMethods: {
                                        minInstallments: 1,
                                        maxInstallments: 1,
                                    },
                                }}
                                locale="es-AR"
                                onSubmit={async (paymentFormData, additionalData) => {
                                    await handleCardAction({
                                        mp_card_token: paymentFormData.token,
                                        mp_payment_method_id: paymentFormData.payment_method_id,
                                        mp_payment_type_id:
                                            additionalData?.paymentTypeId || undefined,
                                        mp_card_last_four:
                                            additionalData?.lastFourDigits || undefined,
                                        mp_cardholder_name:
                                            additionalData?.cardholderName || undefined,
                                    });
                                }}
                                onError={(brickError) => {
                                    const message =
                                        typeof brickError?.message === 'string' && brickError.message.trim()
                                            ? brickError.message
                                            : 'No se pudo cargar el formulario de tarjeta.';
                                    setError(message);
                                }}
                            />
                        )
                    ) : actionMode ? (
                        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                            Falta configurar NEXT_PUBLIC_MP_PUBLIC_KEY para operar la facturación.
                        </div>
                    ) : (
                        <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-medium text-gray-700">
                            No hay una acción pendiente sobre la suscripción en este momento.
                        </div>
                    )}

                    {(submitting || polling) && (
                        <p className="text-sm font-medium text-gray-500">
                            {polling ? 'Sincronizando el estado del cobro...' : 'Procesando con Mercado Pago...'}
                        </p>
                    )}

                    {overview?.actions.can_cancel && overview.subscription && (
                        <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                    <p className="text-sm font-bold text-gray-950">Cancelar renovación</p>
                                    <p className="mt-1 text-sm font-medium text-gray-700">
                                        La cancelación se hará efectiva al próximo vencimiento pagado.
                                    </p>
                                </div>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => void handleCancel()}
                                    disabled={cancelling}
                                >
                                    {cancelling ? 'Cancelando...' : 'Cancelar renovación'}
                                </Button>
                            </div>
                        </div>
                    )}

                    {overview?.subscription?.status === 'CANCELLED' && (
                        <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                            <p className="text-sm font-bold text-gray-950">La suscripción está cancelada.</p>
                            <p className="mt-1 text-sm font-medium text-gray-700">
                                Puedes volver a suscribirte desde esta misma pantalla registrando una tarjeta.
                            </p>
                        </div>
                    )}
                </div>

                <div className="space-y-6">
                    <section className="rounded-2xl border bg-white p-5 sm:p-6">
                        <h2 className="text-lg font-bold text-gray-950">Últimos cobros</h2>
                        <div className="mt-4 space-y-3">
                            {(history?.charges || []).length === 0 ? (
                                <div className="rounded-xl border border-dashed border-gray-200 px-4 py-3 text-sm font-medium text-gray-500">
                                    Todavía no hay cobros registrados.
                                </div>
                            ) : (
                                history?.charges.map((charge) => (
                                    <div key={charge.id} className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                                        <div className="flex items-start justify-between gap-3">
                                            <div>
                                                <p className="text-sm font-bold text-gray-950">{charge.status}</p>
                                                <p className="mt-1 text-xs font-medium text-gray-500">
                                                    {charge.status_detail || 'Sin detalle'}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm font-bold text-gray-950">
                                                    {typeof charge.amount_cents === 'number'
                                                        ? formatMoney(charge.amount_cents / 100)
                                                        : 'Monto pendiente'}
                                                </p>
                                                <p className="mt-1 text-xs font-medium text-gray-500">
                                                    {formatBillingDate(charge.paid_at || charge.due_at || charge.created_at)}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </section>

                    <section className="rounded-2xl border bg-white p-5 sm:p-6">
                        <h2 className="text-lg font-bold text-gray-950">Historial de eventos</h2>
                        <div className="mt-4 space-y-3">
                            {(history?.events || []).length === 0 ? (
                                <div className="rounded-xl border border-dashed border-gray-200 px-4 py-3 text-sm font-medium text-gray-500">
                                    Todavía no hay eventos registrados.
                                </div>
                            ) : (
                                history?.events.map((event) => (
                                    <div key={event.id} className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                                        <div className="flex items-start justify-between gap-3">
                                            <div>
                                                <p className="text-sm font-bold text-gray-950">{event.type}</p>
                                                <p className="mt-1 text-xs font-medium text-gray-500">
                                                    {event.detail || 'Sin detalle adicional'}
                                                </p>
                                            </div>
                                            <p className="text-xs font-medium text-gray-500">
                                                {formatBillingDate(event.created_at)}
                                            </p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </section>
                </div>
            </section>
        </div>
    );
}
