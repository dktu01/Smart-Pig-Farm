'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  PiggyBank, 
  Syringe, 
  SprayCan, 
  Baby,
  Bell,
  CheckCircle2,
  Droplets,
  Home
} from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const [summary, setSummary] = useState({
    totalKandang: 0,
    population: 0,
    nearestVaccine: 'Belum ada jadwal',
    nearestBirth: 'Belum ada jadwal',
    sanitationStatus: 'Belum ada jadwal',
    sanitationDetail: 'Belum ada jadwal',
  });
  
  const [remindersList, setRemindersList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

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

      const nearestVaccine = vaksinRes.data?.[0];
      const nearestSanitation = sanitasiRes.data?.[0];
      const nearestBirth = lahirRes.data?.[0];

      setSummary({
        totalKandang: kandangRes.count || 0,
        population: babiRes.count || 0,
        nearestVaccine: nearestVaccine
          ? `${new Date(nearestVaccine.tanggal_berikutnya).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })} · ${nearestVaccine.babi?.kode_babi || 'Massal'}`
          : 'Belum ada jadwal',
        nearestBirth: nearestBirth
          ? `${new Date(nearestBirth.estimasi_lahir).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })} · ${nearestBirth.babi_betina?.kode_babi || 'Indukan'}`
          : 'Belum ada jadwal',
        sanitationStatus: nearestSanitation
          ? new Date(nearestSanitation.tanggal_berikutnya).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
          : 'Belum ada jadwal',
        sanitationDetail: nearestSanitation
          ? `${nearestSanitation.kandang?.nama_kandang || 'Kandang'} · ${nearestSanitation.jenis_disinfektan || 'Sanitasi terdekat'}`
          : 'Belum ada jadwal',
      });

      const formattedReminders: any[] = [];
      
      if (vaksinRes.data) {
        vaksinRes.data.forEach((v: any) => {
          formattedReminders.push({
            id: `v-${v.id}`,
            title: `Vaksin ${v.jenis_vaksin} - ${v.babi?.kode_babi || 'Massal'}`,
            time: v.tanggal_berikutnya === today ? 'Hari ini' : new Date(v.tanggal_berikutnya).toLocaleDateString('id-ID', {day: 'numeric', month: 'short'}),
            dateObj: new Date(v.tanggal_berikutnya),
            type: 'vaccine',
            icon: Syringe,
            color: 'text-blue-500',
            bg: 'bg-blue-500/10'
          });
        });
      }

      if (sanitasiRes.data) {
        sanitasiRes.data.forEach((s: any) => {
          formattedReminders.push({
            id: `s-${s.id}`,
            title: `Sanitasi ${s.kandang?.nama_kandang || 'Kandang'}`,
            time: s.tanggal_berikutnya === today ? 'Hari ini' : new Date(s.tanggal_berikutnya).toLocaleDateString('id-ID', {day: 'numeric', month: 'short'}),
            dateObj: new Date(s.tanggal_berikutnya),
            type: 'sanitation',
            icon: SprayCan,
            color: 'text-emerald-500',
            bg: 'bg-emerald-500/10'
          });
        });
      }

      if (lahirRes.data) {
        lahirRes.data.forEach((l: any) => {
          formattedReminders.push({
            id: `l-${l.id}`,
            title: `Estimasi Lahir: ${l.babi_betina?.kode_babi}`,
            time: l.estimasi_lahir === today ? 'Hari ini' : new Date(l.estimasi_lahir).toLocaleDateString('id-ID', {day: 'numeric', month: 'short'}),
            dateObj: new Date(l.estimasi_lahir),
            type: 'birth',
            icon: Baby,
            color: 'text-pink-500',
            bg: 'bg-pink-500/10'
          });
        });
      }

      formattedReminders.sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime());
      setRemindersList(formattedReminders.slice(0, 5));
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
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
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Pantau populasi, vaksinasi, reproduksi, dan sanitasi farm secara ringkas.
        </p>
      </div>

      {/* Stats Grid */}
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
                  <h3 className="text-2xl font-bold text-foreground leading-tight">{stat.value}</h3>
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

      <div className="grid grid-cols-1 gap-6">

        {/* Reminders Panel */}
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
                    // Simple navigation based on reminder type
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
