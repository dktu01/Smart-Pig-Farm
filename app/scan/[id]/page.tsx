'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { PiggyBank, Activity, Calendar, Heart, MapPin, Stethoscope, Syringe, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useParams } from 'next/navigation';

type Kandang = {
  nama_kandang: string;
};

type Vaksinasi = {
  id: string;
  jenis_vaksin: string;
  tanggal_vaksin: string;
  tanggal_berikutnya: string;
  catatan: string;
};

type Kesehatan = {
  id: string;
  penyakit: string;
  obat_diberikan: string;
  status: string;
  catatan: string;
  created_at: string;
};

type BabiData = {
  id: string;
  kode_babi: string;
  jenis_kelamin: string;
  tanggal_lahir: string;
  status_kesehatan: string;
  status_reproduksi: string;
  kandang: Kandang;
  vaksinasi: Vaksinasi[];
  kesehatan: Kesehatan[];
};

export default function ScanResultPage() {
  const params = useParams();
  const id = params.id as string;
  
  const [data, setData] = useState<BabiData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchBabiData();
    }
  }, [id]);

  const fetchBabiData = async () => {
    setLoading(true);
    try {
      // Fetch babi data along with kandang
      const { data: babi, error: babiError } = await supabase
        .from('babi')
        .select(`
          *,
          kandang:kandang_id(nama_kandang)
        `)
        .eq('id', id)
        .single();

      if (babiError) throw babiError;
      if (!babi) throw new Error("Data babi tidak ditemukan");

      // Fetch vaksinasi
      const { data: vaksinasi } = await supabase
        .from('vaksinasi')
        .select('*')
        .eq('babi_id', id)
        .order('tanggal_vaksin', { ascending: false });

      // Fetch kesehatan
      const { data: kesehatan } = await supabase
        .from('kesehatan')
        .select('*')
        .eq('babi_id', id)
        .order('created_at', { ascending: false });

      setData({
        ...babi,
        vaksinasi: vaksinasi || [],
        kesehatan: kesehatan || []
      });
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan saat mengambil data');
    } finally {
      setLoading(false);
    }
  };

  const calculateAge = (birthDate: string) => {
    const start = new Date(birthDate);
    const now = new Date();
    const months = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());
    return months === 0 ? '< 1 Bulan' : `${months} Bulan`;
  };

  const getHealthColor = (status: string) => {
    if (status === 'Sehat') return 'bg-emerald-500/15 text-emerald-700 border-emerald-500/30';
    if (status.includes('Ringan')) return 'bg-yellow-500/15 text-yellow-700 border-yellow-500/30';
    if (status.includes('Sedang')) return 'bg-orange-500/15 text-orange-700 border-orange-500/30';
    return 'bg-destructive/15 text-destructive border-destructive/30';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-secondary/30 flex flex-col items-center justify-center p-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
        <p className="text-muted-foreground animate-pulse">Memuat data ternak...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-secondary/30 flex items-center justify-center p-4">
        <div className="bg-card w-full max-w-md p-8 rounded-3xl shadow-xl border border-destructive/20 text-center">
          <AlertCircle className="w-16 h-16 text-destructive mx-auto mb-4 opacity-80" />
          <h1 className="text-2xl font-bold text-foreground mb-2">Data Tidak Ditemukan</h1>
          <p className="text-muted-foreground mb-6">{error || 'QR Code mungkin tidak valid atau data telah dihapus.'}</p>
          <a href="/" className="inline-flex items-center justify-center px-6 py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-colors">
            Kembali ke Beranda
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary/20 py-8 px-4 sm:px-6">
      <div className="max-w-xl mx-auto space-y-6">
        
        {/* Header Card */}
        <div className="bg-card rounded-3xl shadow-sm border border-border overflow-hidden relative">
          <div className="h-32 bg-primary/10 absolute top-0 left-0 right-0"></div>
          
          <div className="pt-24 pb-8 px-6 relative z-10 text-center flex flex-col items-center">
            <div className="w-24 h-24 bg-card rounded-full border-4 border-card shadow-md flex items-center justify-center mb-4 text-primary bg-primary/5">
              <PiggyBank className="w-12 h-12" />
            </div>
            
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground mb-1">
              {data.kode_babi}
            </h1>
            <p className="text-muted-foreground font-medium flex items-center justify-center gap-1.5">
              <MapPin className="w-4 h-4" /> 
              {data.kandang?.nama_kandang || 'Kandang tidak diketahui'}
            </p>
            
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-semibold border ${getHealthColor(data.status_kesehatan)}`}>
                {data.status_kesehatan === 'Sehat' ? <CheckCircle2 className="w-4 h-4 mr-1.5" /> : <Activity className="w-4 h-4 mr-1.5" />}
                {data.status_kesehatan}
              </span>
              <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-semibold bg-secondary text-secondary-foreground border border-border">
                {data.jenis_kelamin}
              </span>
            </div>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-card p-5 rounded-2xl border border-border shadow-sm flex flex-col items-center text-center">
            <Calendar className="w-6 h-6 text-primary mb-2 opacity-80" />
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-1">Umur</p>
            <p className="text-lg font-bold text-foreground">{calculateAge(data.tanggal_lahir)}</p>
          </div>
          <div className="bg-card p-5 rounded-2xl border border-border shadow-sm flex flex-col items-center text-center">
            <Heart className="w-6 h-6 text-pink-500 mb-2 opacity-80" />
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-1">Reproduksi</p>
            <p className="text-lg font-bold text-foreground">{data.status_reproduksi}</p>
          </div>
        </div>

        {/* Riwayat Kesehatan */}
        <div className="bg-card rounded-3xl shadow-sm border border-border overflow-hidden">
          <div className="p-6 border-b border-border flex items-center gap-3">
            <Stethoscope className="w-6 h-6 text-primary" />
            <h2 className="text-xl font-bold text-foreground">Riwayat Medis</h2>
          </div>
          <div className="p-0">
            {data.kesehatan.length === 0 ? (
              <p className="p-6 text-center text-muted-foreground text-sm">Belum ada riwayat medis.</p>
            ) : (
              <ul className="divide-y divide-border">
                {data.kesehatan.map((rekam) => (
                  <li key={rekam.id} className="p-6 hover:bg-secondary/20 transition-colors">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold text-foreground text-lg">{rekam.penyakit}</h3>
                      <span className="text-xs font-medium text-muted-foreground bg-secondary px-2.5 py-1 rounded-full">
                        {new Date(rekam.created_at).toLocaleDateString('id-ID')}
                      </span>
                    </div>
                    <p className="text-sm text-foreground mb-3 flex items-center gap-1.5">
                      <span className="font-medium text-muted-foreground">Obat:</span> {rekam.obat_diberikan || '-'}
                    </p>
                    {rekam.catatan && (
                      <p className="text-sm text-muted-foreground bg-secondary/50 p-3 rounded-xl border border-border">
                        "{rekam.catatan}"
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Riwayat Vaksinasi */}
        <div className="bg-card rounded-3xl shadow-sm border border-border overflow-hidden">
          <div className="p-6 border-b border-border flex items-center gap-3">
            <Syringe className="w-6 h-6 text-emerald-500" />
            <h2 className="text-xl font-bold text-foreground">Riwayat Vaksinasi</h2>
          </div>
          <div className="p-0">
            {data.vaksinasi.length === 0 ? (
              <p className="p-6 text-center text-muted-foreground text-sm">Belum ada riwayat vaksinasi.</p>
            ) : (
              <ul className="divide-y divide-border">
                {data.vaksinasi.map((vaksin) => (
                  <li key={vaksin.id} className="p-6 hover:bg-secondary/20 transition-colors">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold text-foreground text-lg">{vaksin.jenis_vaksin}</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mb-3">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Tanggal Vaksin</p>
                        <p className="text-sm font-medium">{new Date(vaksin.tanggal_vaksin).toLocaleDateString('id-ID')}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Jadwal Berikutnya</p>
                        <p className="text-sm font-medium text-primary">
                          {vaksin.tanggal_berikutnya ? new Date(vaksin.tanggal_berikutnya).toLocaleDateString('id-ID') : '-'}
                        </p>
                      </div>
                    </div>
                    {vaksin.catatan && (
                      <p className="text-sm text-muted-foreground bg-secondary/50 p-3 rounded-xl border border-border">
                        "{vaksin.catatan}"
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
        
      </div>
    </div>
  );
}
