'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, Home, Users, Info, PiggyBank, SprayCan, Plus, X } from 'lucide-react';

export default function DetailKandangPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [loading, setLoading] = useState(true);
  const [kandang, setKandang] = useState<any>(null);
  const [babiList, setBabiList] = useState<any[]>([]);
  const [sanitasiList, setSanitasiList] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('babi');

  // Modal
  const [isSanitasiModalOpen, setIsSanitasiModalOpen] = useState(false);
  const [sanitasiForm, setSanitasiForm] = useState({ tanggal_semprot: new Date().toISOString().split('T')[0], jenis_disinfektan: '', tanggal_berikutnya: '' });

  useEffect(() => {
    if (id) fetchDetailData();
  }, [id]);

  const fetchDetailData = async () => {
    setLoading(true);
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      const userEmail = user?.email;

      if (!userEmail) {
        setKandang(null);
        setBabiList([]);
        setSanitasiList([]);
        return;
      }
      
      // Fetch Kandang
      const { data: kandangData, error: kandangErr } = await supabase
        .from('kandang')
        .select('*')
        .eq('id', id)
        .eq('user_email', userEmail)
        .single();
        
      if (kandangErr) throw kandangErr;
      if (kandangData) setKandang(kandangData);

      // Fetch Babi in this Kandang
      const { data: babiData, error: babiErr } = await supabase
        .from('babi')
        .select('*')
        .eq('kandang_id', id)
        .eq('user_email', userEmail)
        .order('created_at', { ascending: false });
        
      if (babiErr) throw babiErr;
      if (babiData) setBabiList(babiData);

      // Fetch Sanitasi history
      const { data: sanData, error: sanErr } = await supabase
        .from('sanitasi')
        .select('*')
        .eq('kandang_id', id)
        .eq('user_email', userEmail)
        .order('tanggal_semprot', { ascending: false });

      if (sanErr) throw sanErr;
      if (sanData) setSanitasiList(sanData);
    } catch (error: any) {
      console.error('Error fetching detail data:', error);
      // Tampilkan empty state, jangan alert yang mengganggu
    } finally {
      setLoading(false);
    }
  };

  const handleAddSanitasi = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      const userEmail = user?.email;

      if (!userEmail) {
        alert('Session login tidak ditemukan. Silakan login ulang.');
        return;
      }
      const { data, error } = await supabase.from('sanitasi').insert([{
        kandang_id: id,
        tanggal_semprot: sanitasiForm.tanggal_semprot,
        jenis_disinfektan: sanitasiForm.jenis_disinfektan,
        tanggal_berikutnya: sanitasiForm.tanggal_berikutnya || null,
        user_email: userEmail
      }]).select();

      if (error) throw error;

      if (data) {
        setSanitasiList([data[0], ...sanitasiList]);
        setIsSanitasiModalOpen(false);
        setSanitasiForm({ tanggal_semprot: new Date().toISOString().split('T')[0], jenis_disinfektan: '', tanggal_berikutnya: '' });
      }
    } catch (error: any) {
      alert('Gagal menyimpan sanitasi: ' + error.message);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground animate-pulse">Memuat detail kandang...</div>;
  }

  if (!kandang) {
    return <div className="p-8 text-center text-destructive">Data kandang tidak ditemukan!</div>;
  }

  return (
    <div className="space-y-6 pb-28 md:pb-0">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button 
          onClick={() => router.push('/dashboard/kandang')}
          className="p-2 hover:bg-secondary rounded-lg transition-colors text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
            <Home className="w-8 h-8 text-primary" />
            {kandang.nama_kandang}
          </h1>
          <p className="text-muted-foreground mt-1">Detail informasi dan daftar babi di dalam kandang ini.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Info Card */}
        <div className="bg-card border border-border rounded-xl shadow-sm p-6 space-y-4">
          <div className="flex items-center gap-2 border-b border-border pb-3">
            <Info className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold text-foreground">Informasi Kandang</h3>
          </div>
          
          <div className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground">Jenis Kandang</p>
              <p className="font-medium text-foreground">{kandang.jenis_kandang}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Kapasitas Maksimal</p>
              <p className="font-medium text-foreground">{kandang.kapasitas} Ekor</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Jumlah Isi Saat Ini</p>
              <p className={`font-bold text-lg ${babiList.length >= kandang.kapasitas ? 'text-destructive' : 'text-emerald-500'}`}>
                {babiList.length} Ekor
              </p>
            </div>
          </div>
        </div>

        {/* Babi & Sanitasi Tabs Card */}
        <div className="bg-card border border-border rounded-xl shadow-sm p-6 md:col-span-2 flex flex-col h-full min-h-[400px]">
          <div className="flex gap-4 border-b border-border pb-3 mb-4">
            <button 
              onClick={() => setActiveTab('babi')}
              className={`flex items-center gap-2 font-semibold pb-3 -mb-3 border-b-2 transition-colors ${activeTab === 'babi' ? 'text-primary border-primary' : 'text-muted-foreground border-transparent hover:text-foreground'}`}
            >
              <Users className="w-5 h-5" /> Daftar Babi ({babiList.length})
            </button>
            <button 
              onClick={() => setActiveTab('sanitasi')}
              className={`flex items-center gap-2 font-semibold pb-3 -mb-3 border-b-2 transition-colors ${activeTab === 'sanitasi' ? 'text-emerald-500 border-emerald-500' : 'text-muted-foreground border-transparent hover:text-foreground'}`}
            >
              <SprayCan className="w-5 h-5" /> Riwayat Sanitasi
            </button>
            <div className="flex-1"></div>
            <a href="/dashboard/babi" className="flex items-center gap-1.5 px-3 py-1 bg-primary/10 text-primary hover:bg-primary/20 rounded-md transition-colors text-sm font-medium mb-1 border border-transparent">
              <Plus className="w-4 h-4" /> Kelola Babi
            </a>
          </div>

          {activeTab === 'babi' && (
            babiList.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8 border-2 border-dashed border-border rounded-xl bg-secondary/30">
                <PiggyBank className="w-12 h-12 text-muted-foreground opacity-50 mb-3" />
                <p className="text-muted-foreground">Tidak ada babi di kandang ini.</p>
              </div>
            ) : (
              <div className="flex-1 overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-border text-muted-foreground">
                      <th className="pb-3 pr-4 font-medium">Kode Babi</th>
                      <th className="pb-3 px-4 font-medium">Jenis Kelamin</th>
                      <th className="pb-3 px-4 font-medium text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {babiList.map((b) => (
                      <tr key={b.id} className="border-b border-border/50 hover:bg-secondary/50 transition-colors">
                        <td className="py-3 pr-4 font-bold text-foreground">{b.kode_babi}</td>
                        <td className="py-3 px-4">{b.jenis_kelamin}</td>
                        <td className="py-3 px-4 text-right">
                          <a href={`/dashboard/babi/${b.id}`} className="text-sm text-primary hover:underline font-medium">
                            Lihat Detail
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          )}

          {activeTab === 'sanitasi' && (
            <div className="flex-1 flex flex-col">
              <div className="flex justify-end mb-4">
                <button onClick={() => setIsSanitasiModalOpen(true)} className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 rounded-md transition-colors text-sm font-medium">
                  <Plus className="w-4 h-4" /> Catat Sanitasi
                </button>
              </div>
              
              {sanitasiList.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8 border-2 border-dashed border-border rounded-xl bg-secondary/30">
                  <SprayCan className="w-12 h-12 text-muted-foreground opacity-50 mb-3" />
                  <p className="text-muted-foreground">Belum ada riwayat sanitasi di kandang ini.</p>
                </div>
              ) : (
                <div className="flex-1 overflow-x-auto">
                  <table className="w-full text-left text-sm border-collapse">
                    <thead>
                      <tr className="border-b border-border text-muted-foreground">
                        <th className="pb-3 pr-4 font-medium">Tanggal Semprot</th>
                        <th className="pb-3 px-4 font-medium">Jenis Disinfektan</th>
                        <th className="pb-3 px-4 font-medium">Jadwal Berikutnya</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sanitasiList.map((s) => (
                        <tr key={s.id} className="border-b border-border/50 hover:bg-secondary/50 transition-colors">
                          <td className="py-3 pr-4 font-medium">{s.tanggal_semprot}</td>
                          <td className="py-3 px-4">{s.jenis_disinfektan}</td>
                          <td className="py-3 px-4 text-emerald-600 dark:text-emerald-400">{s.tanggal_berikutnya || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ===== STICKY BOTTOM BAR — Mobile Only ===== */}
      <div className="fixed bottom-0 left-0 right-0 md:hidden z-40 bg-card/95 backdrop-blur border-t border-border px-4 py-3 flex gap-3 shadow-2xl">
        <button
          onClick={() => { setActiveTab('sanitasi'); setIsSanitasiModalOpen(true); }}
          className="flex-1 flex items-center justify-center gap-2 py-3 bg-emerald-500 text-white rounded-xl font-semibold text-sm shadow-sm active:scale-95 transition-transform"
        >
          <SprayCan className="w-4 h-4" />
          Catat Sanitasi
        </button>
        <a
          href="/dashboard/babi"
          className="flex-1 flex items-center justify-center gap-2 py-3 bg-primary text-primary-foreground rounded-xl font-semibold text-sm shadow-sm active:scale-95 transition-transform"
        >
          <Plus className="w-4 h-4" />
          Kelola Babi
        </a>
      </div>

      {isSanitasiModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="bg-card w-full max-w-md rounded-2xl shadow-xl border border-border p-5">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Catat Sanitasi Kandang</h2>
              <button onClick={() => setIsSanitasiModalOpen(false)}><X className="w-5 h-5 text-muted-foreground" /></button>
            </div>
            <form onSubmit={handleAddSanitasi} className="space-y-4">
              <div><label className="text-sm font-medium">Tanggal Semprot</label><input type="date" required value={sanitasiForm.tanggal_semprot} onChange={e=>setSanitasiForm({...sanitasiForm, tanggal_semprot: e.target.value})} className="w-full border rounded-lg p-2 bg-background mt-1" /></div>
              <div><label className="text-sm font-medium">Jenis Disinfektan</label><input required value={sanitasiForm.jenis_disinfektan} onChange={e=>setSanitasiForm({...sanitasiForm, jenis_disinfektan: e.target.value})} placeholder="Cth: Formades" className="w-full border rounded-lg p-2 bg-background mt-1" /></div>
              <div><label className="text-sm font-medium">Jadwal Berikutnya (Opsional)</label><input type="date" value={sanitasiForm.tanggal_berikutnya} onChange={e=>setSanitasiForm({...sanitasiForm, tanggal_berikutnya: e.target.value})} className="w-full border rounded-lg p-2 bg-background mt-1" /></div>
              <button type="submit" className="w-full bg-emerald-500 text-white p-2 rounded-lg font-medium hover:bg-emerald-600 transition-colors">Simpan</button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
