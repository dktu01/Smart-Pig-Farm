'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  PiggyBank, 
  Home, 
  Activity, 
  Syringe, 
  SprayCan, 
  Baby,
  AlertTriangle,
  Bell,
  CheckCircle2
} from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const [statsData, setStatsData] = useState({
    totalBabi: 0,
    totalKandang: 0,
    healthyPigs: 0,
    sickPigs: 0,
  });
  
  const [remindersList, setRemindersList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    const today = new Date().toISOString().split('T')[0];
    
    // Fetch counts and upcoming events concurrently
    const [
      babiRes,
      kandangRes,
      healthyRes,
      sickRes,
      vaksinRes,
      sanitasiRes,
      lahirRes
    ] = await Promise.all([
      supabase.from('babi').select('*', { count: 'exact', head: true }),
      supabase.from('kandang').select('*', { count: 'exact', head: true }),
      supabase.from('babi').select('*', { count: 'exact', head: true }).eq('status_kesehatan', 'Sehat'),
      supabase.from('babi').select('*', { count: 'exact', head: true }).neq('status_kesehatan', 'Sehat'),
      supabase.from('vaksinasi').select('*, babi:babi_id(kode_babi)').not('tanggal_berikutnya', 'is', null).gte('tanggal_berikutnya', today).order('tanggal_berikutnya').limit(5),
      supabase.from('sanitasi').select('*, kandang:kandang_id(nama_kandang)').not('tanggal_berikutnya', 'is', null).gte('tanggal_berikutnya', today).order('tanggal_berikutnya').limit(5),
      supabase.from('reproduksi').select('*, babi_betina:babi_betina_id(kode_babi)').eq('status_bunting', true).is('tanggal_melahirkan', null).not('estimasi_lahir', 'is', null).gte('estimasi_lahir', today).order('estimasi_lahir').limit(5)
    ]);

    setStatsData({
      totalBabi: babiRes.count || 0,
      totalKandang: kandangRes.count || 0,
      healthyPigs: healthyRes.count || 0,
      sickPigs: sickRes.count || 0,
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
    setLoading(false);
  };

  const stats = [
    { name: 'Total Babi', value: loading ? '...' : statsData.totalBabi, icon: PiggyBank, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { name: 'Total Kandang', value: loading ? '...' : statsData.totalKandang, icon: Home, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    { name: 'Babi Sehat', value: loading ? '...' : statsData.healthyPigs, icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    { name: 'Babi Sakit', value: loading ? '...' : statsData.sickPigs, icon: Activity, color: 'text-destructive', bg: 'bg-destructive/10' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Home</h1>
        <p className="text-muted-foreground mt-2">
          Pantau kesehatan dan aktivitas farm Anda secara real-time.
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
                : stat.name === 'Total Kandang'
                ? '/dashboard/kandang'
                : stat.name === 'Babi Sehat'
                ? '/dashboard/babi?filter=sehat'
                : '/dashboard/babi?filter=sakit'
            }
            className="bg-card border border-border rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">{stat.name}</p>
                <h3 className="text-3xl font-bold text-foreground">{stat.value}</h3>
              </div>
              <div className={`p-3 rounded-full ${stat.bg}`}>
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
              Pengingat Jadwal
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
