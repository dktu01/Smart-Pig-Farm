'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, Info, Syringe, Heart, PiggyBank, Plus, X } from 'lucide-react';

export default function DetailBabiPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [activeTab, setActiveTab] = useState('info');
  const [loading, setLoading] = useState(true);
  
  // Modal states
  const [isVakModalOpen, setIsVakModalOpen] = useState(false);
  const [isRepModalOpen, setIsRepModalOpen] = useState(false);

  // Form states
  const [vakForm, setVakForm] = useState({ jenis_vaksin: '', tanggal_vaksin: new Date().toISOString().split('T')[0], tanggal_berikutnya: '', catatan: '' });
  const [repForm, setRepForm] = useState({ babi_jantan_kode: '', tanggal_kawin: new Date().toISOString().split('T')[0], status_bunting: false, estimasi_lahir: '' });

  
  const [babi, setBabi] = useState<any>(null);
  const [vaksinasi, setVaksinasi] = useState<any[]>([]);
  const [reproduksi, setReproduksi] = useState<any[]>([]);

  useEffect(() => {
    if (id) fetchDetailData();
  }, [id]);

  const fetchDetailData = async () => {
    setLoading(true);
    
    // Fetch Basic Info
    const { data: babiData } = await supabase
      .from('babi')
      .select('*, kandang:kandang_id(nama_kandang)')
      .eq('id', id)
      .single();
      
    if (babiData) setBabi(babiData);

    // Fetch Vaksinasi
    const { data: vakData } = await supabase
      .from('vaksinasi')
      .select('*')
      .eq('babi_id', id)
      .order('tanggal_vaksin', { ascending: false });
    if (vakData) setVaksinasi(vakData);

    // Fetch Reproduksi (jika betina)
    if (babiData?.jenis_kelamin === 'Betina') {
      const { data: repData } = await supabase
        .from('reproduksi')
        .select('*, jantan:babi_jantan_id(kode_babi)')
        .eq('babi_betina_id', id)
        .order('tanggal_kawin', { ascending: false });
      if (repData) setReproduksi(repData);
    }

    setLoading(false);
  };

  const handleAddVaksin = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data, error } = await supabase.from('vaksinasi').insert([{
      babi_id: id,
      jenis_vaksin: vakForm.jenis_vaksin,
      tanggal_vaksin: vakForm.tanggal_vaksin,
      tanggal_berikutnya: vakForm.tanggal_berikutnya || null,
      catatan: vakForm.catatan
    }]).select();

    if (!error && data) {
      setVaksinasi([data[0], ...vaksinasi]);
      setIsVakModalOpen(false);
      setVakForm({ jenis_vaksin: '', tanggal_vaksin: new Date().toISOString().split('T')[0], tanggal_berikutnya: '', catatan: '' });
    } else alert(error?.message);
  };

  const handleAddReproduksi = async (e: React.FormEvent) => {
    e.preventDefault();
    // Resolve jantan ID if needed, but for simplicity we just store the code if schema allows, or find ID
    const { data: jantanData } = await supabase.from('babi').select('id').eq('kode_babi', repForm.babi_jantan_kode).single();
    
    const { data, error } = await supabase.from('reproduksi').insert([{
      babi_betina_id: id,
      babi_jantan_id: jantanData?.id || null,
      tanggal_kawin: repForm.tanggal_kawin,
      status_bunting: repForm.status_bunting,
      estimasi_lahir: repForm.estimasi_lahir || null
    }]).select('*, jantan:babi_jantan_id(kode_babi)');

    if (!error && data) {
      setReproduksi([data[0], ...reproduksi]);
      setIsRepModalOpen(false);
      setRepForm({ babi_jantan_kode: '', tanggal_kawin: new Date().toISOString().split('T')[0], status_bunting: false, estimasi_lahir: '' });
      await supabase.from('babi').update({ status_reproduksi: repForm.status_bunting ? 'Bunting' : 'Sudah Kawin' }).eq('id', id);
      setBabi({...babi, status_reproduksi: repForm.status_bunting ? 'Bunting' : 'Sudah Kawin'});
    } else alert(error?.message);
  };

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground animate-pulse">Memuat detail babi...</div>;
  }

  if (!babi) {
    return <div className="p-8 text-center text-destructive">Data babi tidak ditemukan!</div>;
  }

  const tabs = [
    { id: 'info', label: 'Informasi Dasar', icon: Info },
    { id: 'vaksinasi', label: 'Riwayat Vaksin', icon: Syringe },
  ];

  if (babi.jenis_kelamin === 'Betina') {
    tabs.push({ id: 'reproduksi', label: 'Reproduksi', icon: Heart });
  }

  return (
    <div className="space-y-6 pb-28 md:pb-0">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button 
          onClick={() => router.push('/dashboard/babi')}
          className="p-2 hover:bg-secondary rounded-lg transition-colors text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
            <PiggyBank className="w-8 h-8 text-primary" />
            Detail: {babi.kode_babi}
          </h1>
          <p className="text-muted-foreground mt-1">Pusat informasi lengkap untuk individu ternak ini.</p>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-border overflow-x-auto hide-scrollbar">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`
              flex items-center gap-2 px-6 py-3 font-medium text-sm transition-colors whitespace-nowrap border-b-2
              ${activeTab === tab.id 
                ? 'border-primary text-primary' 
                : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-secondary/50'}
            `}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="bg-card border border-border rounded-xl shadow-sm p-6 min-h-[400px]">
        
        {/* TAB 1: INFORMASI DASAR */}
        {activeTab === 'info' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b border-border pb-2">Data Indentitas</h3>
              <div className="grid grid-cols-2 gap-y-4">
                <div className="text-sm text-muted-foreground">Kode Babi</div>
                <div className="font-medium text-foreground">{babi.kode_babi}</div>
                
                <div className="text-sm text-muted-foreground">Jenis Kelamin</div>
                <div className="font-medium text-foreground">{babi.jenis_kelamin}</div>
                
                <div className="text-sm text-muted-foreground">Tanggal Lahir</div>
                <div className="font-medium text-foreground">{babi.tanggal_lahir}</div>
              </div>
            </div>
            
            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b border-border pb-2">Status Saat Ini</h3>
              <div className="grid grid-cols-2 gap-y-4">
                <div className="text-sm text-muted-foreground">Kandang</div>
                <div className="font-medium text-foreground">{babi.kandang?.nama_kandang || '-'}</div>
                
                <div className="text-sm text-muted-foreground">Status Reproduksi</div>
                <div className="font-medium text-foreground">{babi.status_reproduksi || '-'}</div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: VAKSINASI */}
        {activeTab === 'vaksinasi' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Catatan Vaksinasi</h3>
              <button onClick={() => setIsVakModalOpen(true)} className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 text-primary hover:bg-primary/20 rounded-md transition-colors text-sm font-medium">
                <Plus className="w-4 h-4" /> Catat Vaksin
              </button>
            </div>
            {vaksinasi.length === 0 ? (
              <p className="text-muted-foreground italic">Belum ada riwayat vaksin.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-border text-muted-foreground">
                      <th className="pb-3 pr-4">Jenis Vaksin</th>
                      <th className="pb-3 px-4">Tanggal Pemberian</th>
                      <th className="pb-3 px-4">Jadwal Berikutnya</th>
                      <th className="pb-3 pl-4">Catatan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {vaksinasi.map((v) => (
                      <tr key={v.id} className="border-b border-border/50 hover:bg-secondary/50">
                        <td className="py-3 pr-4 font-medium">{v.jenis_vaksin}</td>
                        <td className="py-3 px-4">{v.tanggal_vaksin}</td>
                        <td className="py-3 px-4 text-primary">{v.tanggal_berikutnya || '-'}</td>
                        <td className="py-3 pl-4 text-muted-foreground">{v.catatan || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: REPRODUKSI */}
        {activeTab === 'reproduksi' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Siklus Reproduksi (Indukan)</h3>
              <button onClick={() => setIsRepModalOpen(true)} className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 text-primary hover:bg-primary/20 rounded-md transition-colors text-sm font-medium">
                <Plus className="w-4 h-4" /> Catat Kawin/Bunting
              </button>
            </div>
            
            <div className="mb-6 p-4 bg-primary/5 rounded-xl border border-primary/20">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-muted-foreground">Status Saat Ini</p>
                  <p className="font-bold text-lg text-primary">{babi.status_reproduksi}</p>
                </div>
              </div>
            </div>

            {reproduksi.length === 0 ? (
              <p className="text-muted-foreground italic">Belum ada riwayat perkawinan atau kelahiran.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-border text-muted-foreground">
                      <th className="pb-3 pr-4">Tanggal Kawin</th>
                      <th className="pb-3 px-4">Kode Jantan</th>
                      <th className="pb-3 px-4">Status Bunting</th>
                      <th className="pb-3 px-4">Estimasi Lahir</th>
                      <th className="pb-3 pl-4">Tanggal Lahir Aktual</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reproduksi.map((r) => (
                      <tr key={r.id} className="border-b border-border/50 hover:bg-secondary/50">
                        <td className="py-3 pr-4">{r.tanggal_kawin}</td>
                        <td className="py-3 px-4 font-medium">{r.jantan?.kode_babi || '-'}</td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${r.status_bunting ? 'bg-pink-500/10 text-pink-500 border border-pink-500/20' : 'bg-secondary text-secondary-foreground border border-border'}`}>
                            {r.status_bunting ? 'Bunting' : 'Gagal/Belum Diperiksa'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-orange-500">{r.estimasi_lahir || '-'}</td>
                        <td className="py-3 pl-4 font-medium text-emerald-500">{r.tanggal_melahirkan || 'Belum Lahir'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

      </div>

      {/* ===== STICKY BOTTOM BAR — Mobile Only ===== */}
      <div className="fixed bottom-0 left-0 right-0 md:hidden z-40 bg-card/95 backdrop-blur border-t border-border px-4 py-3 flex gap-3 shadow-2xl">
        <button
          onClick={() => setIsVakModalOpen(true)}
          className="flex-1 flex items-center justify-center gap-2 py-3 bg-primary text-primary-foreground rounded-xl font-semibold text-sm shadow-sm active:scale-95 transition-transform"
        >
          <Syringe className="w-4 h-4" />
          Input Vaksin
        </button>
        {babi.jenis_kelamin === 'Betina' && (
          <button
            onClick={() => setIsRepModalOpen(true)}
            className="flex-1 flex items-center justify-center gap-2 py-3 bg-pink-500 text-white rounded-xl font-semibold text-sm shadow-sm active:scale-95 transition-transform"
          >
            <Heart className="w-4 h-4" />
            Reproduksi
          </button>
        )}
      </div>

      {isVakModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="bg-card w-full max-w-md rounded-2xl shadow-xl border border-border p-5">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Catat Vaksinasi</h2>
              <button onClick={() => setIsVakModalOpen(false)}><X className="w-5 h-5 text-muted-foreground" /></button>
            </div>
            <form onSubmit={handleAddVaksin} className="space-y-4">
              <div><label className="text-sm font-medium">Jenis Vaksin</label><input required value={vakForm.jenis_vaksin} onChange={e=>setVakForm({...vakForm, jenis_vaksin: e.target.value})} className="w-full border rounded-lg p-2 bg-background mt-1" /></div>
              <div><label className="text-sm font-medium">Tanggal Vaksin</label><input type="date" required value={vakForm.tanggal_vaksin} onChange={e=>setVakForm({...vakForm, tanggal_vaksin: e.target.value})} className="w-full border rounded-lg p-2 bg-background mt-1" /></div>
              <div><label className="text-sm font-medium">Tanggal Berikutnya (Opsional)</label><input type="date" value={vakForm.tanggal_berikutnya} onChange={e=>setVakForm({...vakForm, tanggal_berikutnya: e.target.value})} className="w-full border rounded-lg p-2 bg-background mt-1" /></div>
              <div><label className="text-sm font-medium">Catatan (Opsional)</label><input value={vakForm.catatan} onChange={e=>setVakForm({...vakForm, catatan: e.target.value})} className="w-full border rounded-lg p-2 bg-background mt-1" /></div>
              <button type="submit" className="w-full bg-primary text-white p-2 rounded-lg font-medium">Simpan</button>
            </form>
          </div>
        </div>
      )}

      {isRepModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="bg-card w-full max-w-md rounded-2xl shadow-xl border border-border p-5">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Catat Reproduksi</h2>
              <button onClick={() => setIsRepModalOpen(false)}><X className="w-5 h-5 text-muted-foreground" /></button>
            </div>
            <form onSubmit={handleAddReproduksi} className="space-y-4">
              <div><label className="text-sm font-medium">Kode Pejantan (Opsional)</label><input value={repForm.babi_jantan_kode} onChange={e=>setRepForm({...repForm, babi_jantan_kode: e.target.value})} placeholder="Cth: PEJ-001" className="w-full border rounded-lg p-2 bg-background mt-1" /></div>
              <div><label className="text-sm font-medium">Tanggal Kawin</label><input type="date" required value={repForm.tanggal_kawin} onChange={e=>{
                const tk = e.target.value;
                const est = new Date(tk);
                est.setDate(est.getDate() + 114);
                setRepForm({...repForm, tanggal_kawin: tk, estimasi_lahir: est.toISOString().split('T')[0]});
              }} className="w-full border rounded-lg p-2 bg-background mt-1" /></div>
              <div className="flex items-center gap-2"><input type="checkbox" id="bunting" checked={repForm.status_bunting} onChange={e=>setRepForm({...repForm, status_bunting: e.target.checked})} className="w-4 h-4" /><label htmlFor="bunting" className="text-sm font-medium">Terkonfirmasi Bunting</label></div>
              {repForm.status_bunting && (
                <div><label className="text-sm font-medium">Estimasi Lahir (+114 Hari)</label><input type="date" value={repForm.estimasi_lahir} onChange={e=>setRepForm({...repForm, estimasi_lahir: e.target.value})} className="w-full border rounded-lg p-2 bg-background mt-1" /></div>
              )}
              <button type="submit" className="w-full bg-primary text-white p-2 rounded-lg font-medium">Simpan</button>
            </form>
          </div>
        </div>
      )}

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/90 backdrop-blur border-t md:hidden flex gap-3 z-50">
        <button
          onClick={() => setIsVakModalOpen(true)}
          className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground py-3 font-semibold active:scale-95 transition-transform"
        >
          <Syringe className="w-4 h-4" />
          Input Vaksin
        </button>
        {babi.jenis_kelamin === 'Betina' && (
          <button
            onClick={() => setIsRepModalOpen(true)}
            className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-pink-500 text-white py-3 font-semibold active:scale-95 transition-transform"
          >
            <Heart className="w-4 h-4" />
            Reproduksi
          </button>
        )}
      </div>
    </div>
  );
}
