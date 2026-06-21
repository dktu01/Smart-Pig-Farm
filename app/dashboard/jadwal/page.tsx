'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Calendar, Filter, Syringe, SprayCan, Baby, CheckCircle2 } from 'lucide-react';

type JadwalItem = {
  id: string;
  tanggal: string;
  kegiatan: 'Vaksin' | 'Sanitasi' | 'Kelahiran';
  objek: string;
  status: string;
  icon: any;
  color: string;
  bg: string;
  dateObj: Date;
  rawId: string; // original table ID
};

export default function JadwalPage() {
  const [loading, setLoading] = useState(true);
  const [jadwal, setJadwal] = useState<JadwalItem[]>([]);
  const [filter, setFilter] = useState<'Semua' | 'Vaksin' | 'Sanitasi' | 'Kelahiran'>('Semua');

  const [isMarkModalOpen, setIsMarkModalOpen] = useState(false);
  const [selectedJadwal, setSelectedJadwal] = useState<JadwalItem | null>(null);
  const [actualDate, setActualDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    fetchJadwal();
  }, []);

  const fetchJadwal = async () => {
    setLoading(true);
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      const userEmail = user?.email;

      if (!userEmail) {
        setJadwal([]);
        return;
      }

      const [vaksinRes, sanitasiRes, lahirRes] = await Promise.all([
        supabase.from('vaksinasi').select('*, babi:babi_id(kode_babi)').eq('user_email', userEmail).not('tanggal_berikutnya', 'is', null),
        supabase.from('sanitasi').select('*, kandang:kandang_id(nama_kandang)').eq('user_email', userEmail).not('tanggal_berikutnya', 'is', null),
        supabase.from('reproduksi').select('*, babi_betina:babi_betina_id(kode_babi)').eq('user_email', userEmail).eq('status_bunting', true).is('tanggal_melahirkan', null).not('estimasi_lahir', 'is', null)
      ]);

      if (vaksinRes.error) throw vaksinRes.error;
      if (sanitasiRes.error) throw sanitasiRes.error;
      if (lahirRes.error) throw lahirRes.error;

      const combined: JadwalItem[] = [];

      if (vaksinRes.data) {
        vaksinRes.data.forEach((v: any) => {
          combined.push({
            id: `v-${v.id}`,
            tanggal: v.tanggal_berikutnya,
            kegiatan: 'Vaksin',
            objek: v.babi?.kode_babi || 'Massal',
            status: 'Menunggu',
            icon: Syringe,
            color: 'text-blue-500',
            bg: 'bg-blue-500/10',
            dateObj: new Date(v.tanggal_berikutnya),
            rawId: v.id
          });
        });
      }

      if (sanitasiRes.data) {
        sanitasiRes.data.forEach((s: any) => {
          combined.push({
            id: `s-${s.id}`,
            tanggal: s.tanggal_berikutnya,
            kegiatan: 'Sanitasi',
            objek: s.kandang?.nama_kandang || 'Kandang',
            status: 'Menunggu',
            icon: SprayCan,
            color: 'text-emerald-500',
            bg: 'bg-emerald-500/10',
            dateObj: new Date(s.tanggal_berikutnya),
            rawId: s.id
          });
        });
      }

      if (lahirRes.data) {
        lahirRes.data.forEach((l: any) => {
          combined.push({
            id: `l-${l.id}`,
            tanggal: l.estimasi_lahir,
            kegiatan: 'Kelahiran',
            objek: l.babi_betina?.kode_babi || 'Indukan',
            status: 'Menunggu',
            icon: Baby,
            color: 'text-pink-500',
            bg: 'bg-pink-500/10',
            dateObj: new Date(l.estimasi_lahir),
            rawId: l.id
          });
        });
      }

      combined.sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime());
      setJadwal(combined);
    } catch (error: any) {
      console.error('Error fetching jadwal:', error);
      // Tampilkan empty state, jangan alert yang mengganggu
      setJadwal([]);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkDone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedJadwal) return;

    try {
      let error = null;

      if (selectedJadwal.kegiatan === 'Vaksin') {
        const res = await supabase.from('vaksinasi').update({ tanggal_berikutnya: null, catatan: `Selesai pada: ${actualDate}` }).eq('id', selectedJadwal.rawId);
        error = res.error;
      } else if (selectedJadwal.kegiatan === 'Sanitasi') {
        const res = await supabase.from('sanitasi').update({ tanggal_berikutnya: null }).eq('id', selectedJadwal.rawId);
        error = res.error;
      } else if (selectedJadwal.kegiatan === 'Kelahiran') {
        const res = await supabase.from('reproduksi').update({ estimasi_lahir: null, tanggal_melahirkan: actualDate }).eq('id', selectedJadwal.rawId);
        error = res.error;
      }

      if (error) throw error;
      setJadwal(jadwal.filter(j => j.id !== selectedJadwal.id));
      setIsMarkModalOpen(false);
    } catch (error: any) {
      alert('Gagal menandai selesai: ' + error.message);
    }
  };

  const filteredJadwal = filter === 'Semua'  
    ? jadwal 
    : jadwal.filter(j => j.kegiatan === filter);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Jadwal Farm</h1>
          <p className="text-muted-foreground mt-1">Pantau jadwal sanitasi, vaksinasi, dan estimasi kelahiran.</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="bg-card border border-border rounded-xl shadow-sm p-4">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-5 h-5 text-muted-foreground" />
          <h3 className="font-semibold text-foreground">Filter Jadwal</h3>
        </div>
        <div className="flex flex-wrap gap-2">
          {['Semua', 'Vaksin', 'Sanitasi', 'Kelahiran'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f as any)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors border ${
                filter === f 
                  ? 'bg-primary text-primary-foreground border-primary' 
                  : 'bg-secondary text-secondary-foreground border-border hover:bg-secondary/80'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden flex flex-col">
        {loading ? (
          <div className="p-8 text-center text-muted-foreground animate-pulse">Memuat jadwal...</div>
        ) : filteredJadwal.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center border-2 border-dashed border-border m-4 rounded-xl bg-secondary/30">
            <Calendar className="w-12 h-12 text-muted-foreground opacity-50 mb-3" />
            <h3 className="text-lg font-medium text-foreground">Tidak Ada Jadwal</h3>
            <p className="text-muted-foreground mt-1 text-sm">Belum ada agenda yang tersimpan untuk filter ini.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse whitespace-nowrap md:whitespace-normal">
              <thead>
                <tr className="bg-secondary/50 border-b border-border">
                  <th className="py-4 px-3 md:px-6 font-medium text-muted-foreground w-24 md:w-32">Tanggal</th>
                  <th className="py-4 px-3 md:px-6 font-medium text-muted-foreground w-14 md:w-40">Keg.</th>
                  <th className="py-4 px-3 md:px-6 font-medium text-muted-foreground">Objek</th>
                  <th className="py-4 px-3 md:px-6 font-medium text-muted-foreground text-right">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredJadwal.map((j) => (
                  <tr key={j.id} className="border-b border-border/50 hover:bg-secondary/50 transition-colors">
                    <td className="py-4 px-3 md:px-6 font-medium text-foreground text-xs md:text-sm">
                      {new Date(j.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </td>
                    <td className="py-4 px-3 md:px-6">
                      <div className="flex items-center gap-2">
                        <div className={`p-1.5 rounded-md ${j.bg}`}>
                          <j.icon className={`w-4 h-4 ${j.color}`} />
                        </div>
                        <span className="hidden md:inline font-medium text-foreground">{j.kegiatan}</span>
                      </div>
                    </td>
                    <td className="py-4 px-3 md:px-6 font-bold text-foreground text-xs md:text-sm">
                      {j.objek}
                    </td>
                    <td className="py-4 px-3 md:px-6 text-right">
                      <button 
                        onClick={() => { setSelectedJadwal(j); setActualDate(new Date().toISOString().split('T')[0]); setIsMarkModalOpen(true); }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-primary/10 text-primary hover:bg-primary/20 border border-transparent transition-colors active:scale-95"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span className="hidden sm:inline">Tandai Selesai</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Tandai Selesai */}
      {isMarkModalOpen && selectedJadwal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="bg-card w-full max-w-md rounded-2xl shadow-xl border border-border p-5">
            <h2 className="text-lg font-semibold mb-2">Konfirmasi Selesai</h2>
            <p className="text-muted-foreground text-sm mb-4">
              Anda menandai jadwal <strong>{selectedJadwal.kegiatan}</strong> untuk <strong>{selectedJadwal.objek}</strong> telah selesai.
            </p>
            <form onSubmit={handleMarkDone} className="space-y-4">
              <div>
                <label className="text-sm font-medium">Tanggal Aktual Dilaksanakan</label>
                <input 
                  type="date" 
                  required 
                  value={actualDate} 
                  onChange={e => setActualDate(e.target.value)} 
                  className="w-full border rounded-lg p-2 bg-background mt-1" 
                />
                <p className="text-xs text-muted-foreground mt-1">Ubah tanggal ini jika pelaksanaannya tidak sesuai estimasi.</p>
              </div>
              <div className="flex gap-2 justify-end mt-4">
                <button type="button" onClick={() => setIsMarkModalOpen(false)} className="px-4 py-2 text-sm font-medium hover:bg-secondary rounded-lg">Batal</button>
                <button type="submit" className="px-4 py-2 text-sm font-medium bg-primary text-white rounded-lg hover:bg-primary/90">Simpan Selesai</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
