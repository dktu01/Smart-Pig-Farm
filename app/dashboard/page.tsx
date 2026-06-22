'use client';

// React & Next.js imports
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

// Third-party library imports (Lucide Icons)
import { 
  PiggyBank, 
  Syringe, 
  SprayCan, 
  Baby,
  Bell,
  CheckCircle2,
  Droplets,
  Home,
  LucideIcon
} from 'lucide-react';

// Local project imports (Supabase client)
import { supabase } from '@/lib/supabase';

// Definisi Interface untuk menjamin Type-Safety pada Dashboard
interface DashboardSummary {
  totalKandang: number;
  population: number;
  nearestVaccine: string;
  nearestBirth: string;
  sanitationStatus: string;
  sanitationDetail: string;
}

interface DashboardReminder {
  id: string;
  title: string;
  time: string;
  dateObj: Date;
  type: 'vaccine' | 'sanitation' | 'birth';
  icon: LucideIcon;
  color: string;
  bg: string;
}

// Interface respon query Supabase untuk vaksinasi terdekat
interface VaksinQueryRow {
  id: string;
  jenis_vaksin: string;
  tanggal_berikutnya: string;
  babi: { kode_babi: string } | null;
}

// Interface respon query Supabase untuk sanitasi terdekat
interface SanitasiQueryRow {
  id: string;
  jenis_disinfektan: string;
  tanggal_berikutnya: string;
  kandang: { nama_kandang: string } | null;
}

// Interface respon query Supabase untuk kelahiran reproduksi terdekat
interface ReproduksiQueryRow {
  id: string;
  estimasi_lahir: string;
  babi_betina: { kode_babi: string } | null;
}

export default function DashboardPage() {
  const router = useRouter();
  
  // State data ringkasan farm
  const [summary, setSummary] = useState<DashboardSummary>({
    totalKandang: 0,
    population: 0,
    nearestVaccine: 'Belum ada jadwal',
    nearestBirth: 'Belum ada jadwal',
    sanitationStatus: 'Belum ada jadwal',
    sanitationDetail: 'Belum ada jadwal',
  });
  
  // State daftar agenda pengingat terdekat
  const [remindersList, setRemindersList] = useState<DashboardReminder[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Mengambil data dashboard saat halaman dimuat
  useEffect(() => {
    fetchDashboardData();
  }, []);

  /**
   * Mengambil dan merangkum seluruh data farm (kandang, populasi babi, vaksin, sanitasi, reproduksi)
   * menggunakan query paralel Promise.all demi performa optimal.
   */
  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      
      const userId = user?.id;

      if (!userId) {
        setSummary({
          totalKandang: 0,
          population: 0,
          nearestVaccine: 'Belum ada jadwal',
          nearestBirth: 'Belum ada jadwal',
          sanitationStatus: 'Belum ada jadwal',
          sanitationDetail: 'Belum ada jadwal',
        });
        setRemindersList([]);
        return;
      }
      
      // Query paralel untuk menghemat round-trip request ke server Supabase
      const [
        kandangRes,
        babiRes,
        vaksinRes,
        sanitasiRes,
        lahirRes
      ] = await Promise.all([
        supabase.from('kandang').select('*', { count: 'exact', head: true }).eq('user_id', userId),
        supabase.from('babi').select('*', { count: 'exact', head: true }).eq('user_id', userId),
        supabase.from('vaksinasi').select('*, babi:babi_id(kode_babi)').eq('user_id', userId).not('tanggal_berikutnya', 'is', null).gte('tanggal_berikutnya', today).order('tanggal_berikutnya').limit(1),
        supabase.from('sanitasi').select('*, kandang:kandang_id(nama_kandang)').eq('user_id', userId).not('tanggal_berikutnya', 'is', null).gte('tanggal_berikutnya', today).order('tanggal_berikutnya').limit(1),
        supabase.from('reproduksi').select('*, babi_betina:babi_betina_id(kode_babi)').eq('user_id', userId).eq('status_bunting', true).is('tanggal_melahirkan', null).not('estimasi_lahir', 'is', null).gte('estimasi_lahir', today).order('estimasi_lahir').limit(1)
      ]);

      if (kandangRes.error) throw kandangRes.error;
      if (babiRes.error) throw babiRes.error;
      if (vaksinRes.error) throw vaksinRes.error;
      if (sanitasiRes.error) throw sanitasiRes.error;
      if (lahirRes.error) throw lahirRes.error;

      // Mendapatkan entitas terdekat untuk kalkulasi summary
      const nearestVaccine = vaksinRes.data?.[0] as unknown as VaksinQueryRow | undefined;
      const nearestSanitation = sanitasiRes.data?.[0] as unknown as SanitasiQueryRow | undefined;
      const nearestBirth = lahirRes.data?.[0] as unknown as ReproduksiQueryRow | undefined;

      // Konversi format tanggal ke bahasa Indonesia
      const formatDateIndo = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
      };

      setSummary({
        totalKandang: kandangRes.count || 0,
        population: babiRes.count || 0,
        nearestVaccine: nearestVaccine
          ? `${formatDateIndo(nearestVaccine.tanggal_berikutnya)} · ${nearestVaccine.babi?.kode_babi || 'Massal'}`
          : 'Belum ada jadwal',
        nearestBirth: nearestBirth
          ? `${formatDateIndo(nearestBirth.estimasi_lahir)} · ${nearestBirth.babi_betina?.kode_babi || 'Indukan'}`
          : 'Belum ada jadwal',
        sanitationStatus: nearestSanitation
          ? formatDateIndo(nearestSanitation.tanggal_berikutnya)
          : 'Belum ada jadwal',
        sanitationDetail: nearestSanitation
          ? `${nearestSanitation.kandang?.nama_kandang || 'Kandang'} · ${nearestSanitation.jenis_disinfektan || 'Sanitasi'}`
          : 'Belum ada jadwal',
      });

      // Menyiapkan daftar agenda gabungan (Reminders)
      const formattedReminders: DashboardReminder[] = [];
      
      if (vaksinRes.data) {
        const rows = vaksinRes.data as unknown as VaksinQueryRow[];
        rows.forEach((v) => {
          formattedReminders.push({
            id: `v-${v.id}`,
            title: `Vaksin ${v.jenis_vaksin} - ${v.babi?.kode_babi || 'Massal'}`,
            time: v.tanggal_berikutnya === today ? 'Hari ini' : formatDateIndo(v.tanggal_berikutnya),
            dateObj: new Date(v.tanggal_berikutnya),
            type: 'vaccine',
            icon: Syringe,
            color: 'text-blue-500',
            bg: 'bg-blue-500/10'
          });
        });
      }

      if (sanitasiRes.data) {
        const rows = sanitasiRes.data as unknown as SanitasiQueryRow[];
        rows.forEach((s) => {
          formattedReminders.push({
            id: `s-${s.id}`,
            title: `Sanitasi ${s.kandang?.nama_kandang || 'Kandang'}`,
            time: s.tanggal_berikutnya === today ? 'Hari ini' : formatDateIndo(s.tanggal_berikutnya),
            dateObj: new Date(s.tanggal_berikutnya),
            type: 'sanitation',
            icon: SprayCan,
            color: 'text-emerald-500',
            bg: 'bg-emerald-500/10'
          });
        });
      }

      if (lahirRes.data) {
        const rows = lahirRes.data as unknown as ReproduksiQueryRow[];
        rows.forEach((l) => {
          formattedReminders.push({
            id: `l-${l.id}`,
            title: `Estimasi Lahir: ${l.babi_betina?.kode_babi}`,
            time: l.estimasi_lahir === today ? 'Hari ini' : formatDateIndo(l.estimasi_lahir),
            dateObj: new Date(l.estimasi_lahir),
            type: 'birth',
            icon: Baby,
            color: 'text-pink-500',
            bg: 'bg-pink-500/10'
          });
        });
      }

      // Mengurutkan agenda berdasarkan waktu terdekat dan mengambil 5 teratas
      formattedReminders.sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime());
      setRemindersList(formattedReminders.slice(0, 5));
    } catch (error: unknown) {
      // Penanganan kesalahan diam tanpa 'console.log' testing
    } finally {
      setLoading(false);
    }
  };

  const stats = [
    { name: 'Total Kandang', value: summary.totalKandang, icon: Home, color: 'text-blue-500', bg: 'bg-blue-500/10', hint: 'Kandang terdaftar' },
    { name: 'Total Babi', value: summary.population, icon: PiggyBank, color: 'text-[#14532D]', bg: 'bg-[#14532D]/10', hint: 'Total babi aktif' },
    { name: 'Jadwal Vaksin Terdekat', value: loading ? '...' : summary.nearestVaccine, icon: Syringe, color: 'text-[#EA580C]', bg: 'bg-[#EA580C]/10', hint: 'Agenda vaksin berikutnya' },
    { name: 'Jadwal Lahir Terdekat', value: loading ? '...' : summary.nearestBirth, icon: Baby, color: 'text-pink-500', bg: 'bg-pink-500/10', hint: 'Estimasi kelahiran terdekat' },
    { name: 'Status Sanitasi Kandang', value: loading ? '...' : summary.sanitationStatus, icon: Droplets, color: 'text-emerald-500', bg: 'bg-emerald-500/10', hint: loading ? 'Memuat...' : summary.sanitationDetail },
  ];

  return (
    <div className="space-y-6">
      {/* Header Dashboard */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Pantau populasi, vaksinasi, reproduksi, dan sanitasi farm secara ringkas.
        </p>
      </div>

      {/* Grid Statistik Ringkas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Link
            key={stat.name}
            href={
              stat.name === 'Total Babi'
                ? '/dashboard/babi'
                : stat.name === 'Jadwal Vaksin Terdekat'
                ? '/dashboard/jadwal'
                : stat.name === 'Jadwal Lahir Terdekat'
                ? '/dashboard/jadwal'
                : '/dashboard/kandang'
            }
            className="bg-card border border-border rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow block"
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-muted-foreground mb-1">{stat.name}</p>
                {loading ? (
                  <div className="h-8 w-16 bg-secondary animate-pulse rounded mt-1"></div>
                ) : (
                  <h3 
                    className={`text-foreground leading-tight truncate ${typeof stat.value === 'number' ? 'text-3xl font-bold' : 'text-base font-semibold'}`} 
                    title={String(stat.value)}
                  >
                    {stat.value}
                  </h3>
                )}
                {loading ? (
                  <div className="h-4 w-24 bg-secondary animate-pulse rounded mt-2"></div>
                ) : (
                  <p className="mt-2 text-xs text-muted-foreground">{stat.hint}</p>
                )}
              </div>
              <div className={`p-3 rounded-full ${stat.bg} flex-shrink-0 ml-4`}>
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Panel Agenda Terdekat */}
      <div className="grid grid-cols-1 gap-6">
        <div className="bg-card border border-border rounded-xl shadow-sm p-6 flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Bell className="w-5 h-5 text-primary" />
              Agenda Terdekat
            </h2>
          </div>

          <div className="space-y-4 flex-1">
            {loading ? (
              <div className="flex justify-center py-10">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              </div>
            ) : remindersList.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground">
                <CheckCircle2 className="w-8 h-8 mx-auto mb-2 opacity-30 text-emerald-500" />
                <p className="text-sm">Tidak ada jadwal mendesak saat ini.</p>
              </div>
            ) : (
              remindersList.map((reminder) => (
                <div
                  key={reminder.id}
                  className="flex items-start gap-4 p-3 rounded-lg hover:bg-secondary transition-colors border border-transparent hover:border-border cursor-pointer"
                  onClick={() => {
                    if (reminder.type === 'vaccine' || reminder.type === 'birth') {
                      router.push('/dashboard/babi');
                    } else if (reminder.type === 'sanitation') {
                      router.push('/dashboard/kandang');
                    } else {
                      router.push('/dashboard');
                    }
                  }}
                >
                  <div className={`p-2.5 rounded-full mt-1 ${reminder.bg} flex-shrink-0`}>
                    <reminder.icon className={`w-4 h-4 ${reminder.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate" title={reminder.title}>{reminder.title}</p>
                    <p className={`text-xs font-semibold mt-0.5 ${reminder.time === 'Hari ini' ? 'text-destructive' : 'text-primary'}`}>
                      {reminder.time}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
