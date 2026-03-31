'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import {
  ArrowRight,
  LocateFixed,
  MapPin,
  Search,
  Store,
} from 'lucide-react';
import { BrandMark } from '@/components/brand-mark';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { fetchNearbyMerchants, type NearbyMerchant } from '@/lib/api';

const DEFAULT_RADIUS_KM = 8;

function formatDistance(value: number) {
  if (value < 1) {
    return `${Math.round(value * 1000)} m`;
  }

  return `${value.toFixed(1)} km`;
}

export default function Home() {
  const [slug, setSlug] = useState('');
  const [loadingSlug, setLoadingSlug] = useState(false);
  const [discovering, setDiscovering] = useState(false);
  const [nearbyMerchants, setNearbyMerchants] = useState<NearbyMerchant[]>([]);
  const [nearbyError, setNearbyError] = useState('');
  const [nearbyRadiusKm, setNearbyRadiusKm] = useState(DEFAULT_RADIUS_KM);
  const [locationEnabled, setLocationEnabled] = useState(false);
  const router = useRouter();

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const normalizedSlug = slug.trim().toLowerCase();
    if (!normalizedSlug) return;
    setLoadingSlug(true);
    router.push(`/m/${normalizedSlug}`);
  };

  const handleDiscoverNearby = async () => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setNearbyError('Tu navegador no permite acceder a la ubicación del dispositivo.');
      return;
    }

    setDiscovering(true);
    setNearbyError('');

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 12000,
          maximumAge: 0,
        });
      });

      const response = await fetchNearbyMerchants({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        radiusKm: DEFAULT_RADIUS_KM,
        limit: 12,
      });

      setLocationEnabled(true);
      setNearbyRadiusKm(response.radius_km || DEFAULT_RADIUS_KM);
      setNearbyMerchants(response.items || []);

      if (!response.items?.length) {
        setNearbyError('No encontramos locales cargados dentro de tu zona por ahora.');
      }
    } catch (error) {
      const geolocationErrorCode =
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        typeof (error as { code?: unknown }).code === 'number'
          ? Number((error as { code: number }).code)
          : null;

      if (geolocationErrorCode !== null) {
        if (geolocationErrorCode === 1) {
          setNearbyError('Necesitamos tu ubicación para mostrar solo locales de tu zona.');
        } else {
          setNearbyError('No pudimos obtener tu ubicación actual.');
        }
      } else if (error instanceof Error && error.message.trim()) {
        setNearbyError(error.message);
      } else {
        setNearbyError('No pudimos cargar los locales cercanos.');
      }
    } finally {
      setDiscovering(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] px-4 py-6 text-white sm:px-6 lg:px-8">
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 lg:gap-8">
        <section className="overflow-hidden rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_top_left,_rgba(245,158,11,0.18),_transparent_34%),linear-gradient(180deg,_rgba(24,24,27,0.98),_rgba(10,10,11,0.96))] p-5 shadow-[0_30px_100px_rgba(0,0,0,0.45)] sm:p-8">
          <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
            <div className="space-y-5">
              <div className="inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-zinc-300">
                <BrandMark size={24} className="h-6 w-6" priority />
                Daltri Menu
              </div>

              <div className="space-y-3">
                <h1 className="max-w-2xl text-4xl font-bold tracking-tight text-white sm:text-5xl">
                  Explora catálogos y locales cerca de ti.
                </h1>
                <p className="max-w-2xl text-sm leading-7 text-zinc-300 sm:text-base">
                  Puedes entrar por código o permitir ubicación para ver solo negocios
                  publicados dentro de tu zona actual.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3 text-xs font-medium text-zinc-400 sm:text-sm">
                <span className="rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1.5 text-amber-300">
                  Solo mostramos locales dentro de {DEFAULT_RADIUS_KM} km
                </span>
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5">
                  Ubicación solo bajo permiso
                </span>
              </div>
            </div>

            <div className="rounded-[1.75rem] border border-white/10 bg-black/35 p-5 backdrop-blur-sm sm:p-6">
              <div className="mb-5 flex justify-center">
                <BrandMark size={72} className="h-[72px] w-[72px]" priority />
              </div>

              <h2 className="text-center text-3xl font-bold tracking-tight text-white">
                Ver un catálogo
              </h2>
              <p className="mt-2 text-center text-sm text-zinc-400">
                Ingresa el código del negocio o explora locales cercanos desde tu móvil.
              </p>

              <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-3">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                  <Input
                    type="text"
                    placeholder="Código del negocio (ej. casa-nera-cafe)"
                    value={slug}
                    onChange={(event) => setSlug(event.target.value)}
                    className="h-12 rounded-xl border-white/10 bg-black/50 pl-11 text-white placeholder:text-zinc-600 focus:border-amber-500 focus:ring-amber-500"
                    disabled={loadingSlug}
                  />
                </div>

                <Button
                  type="submit"
                  disabled={loadingSlug || !slug.trim()}
                  className="h-12 rounded-xl bg-white font-semibold text-black hover:bg-zinc-200"
                >
                  {loadingSlug ? 'Cargando...' : 'Ver catálogo'}
                  {!loadingSlug && <ArrowRight className="ml-2 h-4 w-4" />}
                </Button>
              </form>

              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                <Link href="/login" className="w-full">
                  <Button
                    variant="outline"
                    className="h-11 w-full rounded-xl border-zinc-800 bg-zinc-950 text-zinc-200 hover:bg-zinc-900"
                  >
                    Entrar a mi panel
                  </Button>
                </Link>
                <Link href="/register" className="w-full">
                  <Button
                    variant="outline"
                    className="h-11 w-full rounded-xl border-amber-500/25 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20"
                  >
                    Crear catálogo
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-[2rem] border border-white/10 bg-zinc-950/70 p-5 shadow-[0_20px_60px_rgba(0,0,0,0.35)] sm:p-8">
          <div className="flex flex-col gap-4 border-b border-white/10 pb-5 sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-500">
                Explorar locales
              </p>
              <h2 className="text-2xl font-bold text-white sm:text-3xl">
                Descubre negocios publicados en tu área.
              </h2>
              <p className="max-w-2xl text-sm leading-7 text-zinc-400 sm:text-base">
                Pedimos acceso a tu ubicación solo para listar negocios cercanos. No se
                muestran locales fuera de tu zona actual.
              </p>
            </div>

            <Button
              type="button"
              onClick={() => void handleDiscoverNearby()}
              disabled={discovering}
              className="h-11 rounded-xl bg-amber-500 text-black hover:bg-amber-400"
            >
              <LocateFixed className="mr-2 h-4 w-4" />
              {discovering ? 'Buscando cerca de ti...' : 'Explorar locales cerca de ti'}
            </Button>
          </div>

          <div className="mt-5 space-y-4">
            {locationEnabled && !nearbyError && (
              <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
                Mostrando negocios publicados dentro de {nearbyRadiusKm} km de tu ubicación actual.
              </div>
            )}

            {nearbyError && (
              <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                {nearbyError}
              </div>
            )}

            {(nearbyError || nearbyMerchants.length === 0) && (
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-xs font-medium leading-6 text-zinc-400">
                Para aparecer aquí, un negocio debe estar activo, publicado, con ubicación cargada y con facturación habilitada.
              </div>
            )}

            {!nearbyMerchants.length && !nearbyError && !discovering && (
              <div className="rounded-[1.5rem] border border-dashed border-white/10 bg-black/20 px-5 py-10 text-center text-sm text-zinc-500">
                Activa la ubicación para cargar los locales disponibles alrededor tuyo.
              </div>
            )}

            {nearbyMerchants.length > 0 && (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {nearbyMerchants.map((merchant) => (
                  <Link
                    key={merchant.id}
                    href={`/m/${merchant.slug}`}
                    className="group overflow-hidden rounded-[1.6rem] border border-white/10 bg-[#0b0b0d] transition-transform hover:-translate-y-0.5 hover:border-amber-500/40"
                  >
                    <div
                      className="relative h-36 border-b border-white/10 bg-cover bg-center"
                      style={{
                        backgroundImage: merchant.cover_url
                          ? `linear-gradient(180deg, rgba(0,0,0,0.08), rgba(0,0,0,0.72)), url(${merchant.cover_url})`
                          : 'linear-gradient(135deg, rgba(245,158,11,0.28), rgba(24,24,27,0.95))',
                      }}
                    >
                      <div className="absolute inset-x-0 top-0 flex items-start justify-between p-4">
                        <span className="rounded-full border border-white/15 bg-black/35 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/85">
                          {merchant.is_open_now ? 'Abierto ahora' : 'Cerrado'}
                        </span>
                        <span className="rounded-full border border-white/15 bg-black/35 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/85">
                          {formatDistance(merchant.distance_km)}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-4 p-4">
                      <div className="flex items-start gap-3">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-white/5">
                          {merchant.logo_url ? (
                            <img
                              src={merchant.logo_url}
                              alt={merchant.name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <Store className="h-5 w-5 text-zinc-300" />
                          )}
                        </div>
                        <div className="min-w-0 space-y-1">
                          <p className="truncate text-lg font-semibold text-white">
                            {merchant.name}
                          </p>
                          <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">
                            {merchant.business_type || 'Negocio'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-2 text-sm text-zinc-400">
                        <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-zinc-500" />
                        <span className="line-clamp-2">
                          {merchant.address || 'Ubicación cargada en tu zona'}
                        </span>
                      </div>

                      <div className="flex items-center justify-between border-t border-white/10 pt-3 text-sm font-medium text-zinc-300">
                        <span>Ver catálogo</span>
                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
