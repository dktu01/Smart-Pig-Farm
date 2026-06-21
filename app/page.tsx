import Link from 'next/link';

export default function Home() {
  const logoSrc = '/assets/logo-placeholder.svg';

  return (
    <main className="min-h-screen bg-[#FAF9F7] text-[#14532D] relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(20,83,45,0.10),_transparent_38%),radial-gradient(circle_at_bottom_right,_rgba(234,88,12,0.10),_transparent_30%)]" />
      <div className="relative mx-auto flex min-h-screen max-w-7xl flex-col px-6 py-6 lg:px-10">
        <header className="flex items-center justify-between gap-4 rounded-3xl border border-[#14532D]/10 bg-white/80 px-5 py-4 shadow-sm backdrop-blur">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#14532D] text-white shadow-lg shadow-[#14532D]/20">
              <img src={logoSrc} alt="Smart Pig Farm logo placeholder" className="h-7 w-7 object-contain" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#EA580C]">Smart Pig Farm</p>
              <h1 className="text-lg font-semibold text-[#14532D]">Welcome</h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="rounded-full border border-[#14532D]/15 px-4 py-2 text-sm font-semibold text-[#14532D] transition-colors hover:bg-[#14532D]/5">
              Login
            </Link>
            <Link href="/register" className="rounded-full bg-[#EA580C] px-4 py-2 text-sm font-semibold text-white shadow-md shadow-[#EA580C]/20 transition-colors hover:bg-[#c84f0a]">
              Register
            </Link>
          </div>
        </header>

        <section className="grid flex-1 items-center gap-12 py-10 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#14532D]/10 bg-white/80 px-4 py-2 text-sm font-medium text-[#14532D] shadow-sm backdrop-blur">
              <span className="h-2 w-2 rounded-full bg-[#EA580C]" />
              Warm Cream UI for academic presentation
            </div>

            <div className="space-y-5 max-w-2xl">
              <h2 className="text-5xl font-black tracking-tight text-[#14532D] md:text-7xl">
                Smart Pig Farm
              </h2>
              <p className="max-w-xl text-lg leading-8 text-[#14532D]/75 md:text-xl">
                Sistem manajemen peternakan yang fokus, rapi, dan mudah dipresentasikan: reproduksi, vaksinasi, QRCode, sanitasi, serta jadwal yang terstruktur.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link href="/login" className="inline-flex items-center justify-center rounded-full bg-[#14532D] px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-[#14532D]/15 transition-transform hover:-translate-y-0.5 active:scale-95">
                Login ke Dashboard
              </Link>
              <Link href="/register" className="inline-flex items-center justify-center rounded-full border border-[#14532D]/15 bg-white px-6 py-3.5 text-sm font-semibold text-[#14532D] shadow-sm transition-transform hover:-translate-y-0.5 active:scale-95">
                Buat Akun
              </Link>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {[
                'Reproduksi',
                'Vaksinasi & Jadwal',
                'QR Identity',
              ].map((item) => (
                <div key={item} className="rounded-2xl border border-[#14532D]/10 bg-white/85 p-4 shadow-sm backdrop-blur">
                  <p className="text-sm font-semibold text-[#14532D]">{item}</p>
                  <p className="mt-1 text-xs leading-5 text-[#14532D]/65">Ringkas, jelas, dan cocok untuk demonstrasi sidang.</p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="absolute -left-6 top-8 h-24 w-24 rounded-full bg-[#EA580C]/20 blur-2xl" />
            <div className="absolute -right-4 bottom-10 h-28 w-28 rounded-full bg-[#14532D]/15 blur-2xl" />
            <div className="relative overflow-hidden rounded-[2rem] border border-[#14532D]/10 bg-white/90 p-6 shadow-2xl shadow-[#14532D]/10 backdrop-blur">
              <div className="rounded-3xl bg-[#14532D] px-5 py-4 text-white shadow-inner">
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/70">Preview</p>
                <p className="mt-2 text-2xl font-bold">Dashboard Overview</p>
                <p className="mt-2 max-w-sm text-sm leading-6 text-white/75">Ruang kerja yang tenang untuk melihat agenda utama farm tanpa distraksi visual yang berat.</p>
              </div>

              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                {[
                  { label: 'Populasi', value: 'Realtime' },
                  { label: 'Sanitasi', value: 'Terjadwal' },
                  { label: 'Vaksin', value: 'Terkontrol' },
                  { label: 'Reproduksi', value: 'Terpantau' },
                ].map((item) => (
                  <div key={item.label} className="rounded-2xl border border-[#14532D]/10 bg-[#FAF9F7] p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#EA580C]">{item.label}</p>
                    <p className="mt-2 text-lg font-bold text-[#14532D]">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
