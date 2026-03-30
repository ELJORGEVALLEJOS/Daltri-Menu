const DEMO_SLUG =
    process.env.NEXT_PUBLIC_DEMO_CATALOG_SLUG?.trim() || 'casa-nera-cafe';

export default function DemoPage() {
    const demoUrl = `/m/${DEMO_SLUG}`;

    return (
        <main className="min-h-screen bg-[#f6f1e8] px-4 py-10 text-[#1f130d] sm:px-6 lg:px-8">
            <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[minmax(0,0.8fr)_minmax(360px,430px)] lg:items-center">
                <section className="space-y-6">
                    <span className="inline-flex rounded-full bg-[#7a3413]/10 px-4 py-2 text-xs font-black uppercase tracking-[0.24em] text-[#7a3413]">
                        Demo en vivo
                    </span>
                    <div className="space-y-4">
                        <h1 className="max-w-2xl font-sans text-4xl font-black leading-tight tracking-tight sm:text-5xl">
                            Casa Nera Cafe
                        </h1>
                        <p className="max-w-2xl text-base leading-relaxed text-[#5f4b3f] sm:text-lg">
                            Cafe de especialidad, pasteleria artesanal y opciones para llevar.
                        </p>
                        <p className="max-w-2xl text-sm font-semibold uppercase tracking-[0.18em] text-[#7a3413]/80">
                            Pedidos por WhatsApp · Retiro y envio · Abierto hoy
                        </p>
                        <p className="max-w-2xl text-base leading-relaxed text-[#5f4b3f] sm:text-lg">
                            Explora un catalogo real, agrega productos al carrito y revisa como
                            queda listo el pedido antes de enviarlo por WhatsApp.
                        </p>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-3">
                        {[
                            'Catalogo real en vivo',
                            'Carrito y checkout prolijos',
                            'Pedido claro para WhatsApp',
                        ].map((item) => (
                            <div
                                key={item}
                                className="rounded-3xl border border-[#7a3413]/10 bg-white/80 px-5 py-4 shadow-[0_20px_60px_rgba(31,19,13,0.08)]"
                            >
                                <p className="text-sm font-semibold text-[#1f130d]">{item}</p>
                            </div>
                        ))}
                    </div>

                    <div className="flex flex-wrap gap-3">
                        <a
                            href={demoUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center justify-center rounded-2xl bg-[#7a3413] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#61270d]"
                        >
                            Ver catalogo real
                        </a>
                        <a
                            href="/register"
                            className="inline-flex items-center justify-center rounded-2xl border border-[#7a3413]/20 bg-white/70 px-5 py-3 text-sm font-bold text-[#7a3413] transition hover:border-[#7a3413]/40 hover:bg-white"
                        >
                            Crear catalogo como este
                        </a>
                    </div>
                </section>

                <section className="mx-auto w-full max-w-[430px]">
                    <div className="rounded-[2.75rem] border border-[#1f130d]/10 bg-[#201510] p-3 shadow-[0_35px_100px_rgba(31,19,13,0.24)]">
                        <div className="overflow-hidden rounded-[2.2rem] bg-white">
                            <div className="flex items-center justify-center bg-[#111111] px-5 py-3">
                                <div className="h-1.5 w-24 rounded-full bg-white/80" />
                            </div>
                            <iframe
                                title="Demo móvil de Daltri Menu"
                                src={demoUrl}
                                className="h-[740px] w-full border-0 bg-white"
                            />
                        </div>
                    </div>
                </section>
            </div>
        </main>
    );
}
