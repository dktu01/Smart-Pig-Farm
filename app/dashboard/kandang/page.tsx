'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Home, Plus, QrCode, Printer, X, Search, MoreVertical, Trash2, Edit } from 'lucide-react';

// Type definition based on our Supabase schema
type Kandang = {
  id: string;
  nama_kandang: string;
  jenis_kandang: string;
  kapasitas: number;
  qr_code_url: string | null;
  created_at: string;
  babi?: { id: string }[];
};

export default function KandangPage() {
  const [kandangList, setKandangList] = useState<Kandang[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [selectedKandang, setSelectedKandang] = useState<Kandang | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    nama_kandang: '',
    jenis_kandang: 'Indukan',
    kapasitas: 10,
  });

  useEffect(() => {
    fetchKandang();
  }, []);

  const fetchKandang = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('kandang')
      .select('*, babi(id)')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching kandang:', error);
    } else {
      setKandangList(data || []);
    }
    setLoading(false);
  };

  const handleAddKandang = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isEditMode && selectedKandang) {
      // Edit Mode
      const { data, error } = await supabase
        .from('kandang')
        .update({ 
          nama_kandang: formData.nama_kandang, 
          jenis_kandang: formData.jenis_kandang,
          kapasitas: formData.kapasitas
        })
        .eq('id', selectedKandang.id)
        .select();

      if (error) {
        alert('Gagal mengupdate kandang: ' + error.message);
      } else {
        const updatedList = kandangList.map(k => {
          if (k.id === selectedKandang.id) {
            return { ...k, ...data[0], babi: k.babi };
          }
          return k;
        });
        setKandangList(updatedList);
        setIsAddModalOpen(false);
        setIsEditMode(false);
        setSelectedKandang(null);
      }
    } else {
      // Add Mode
      const { data, error } = await supabase
        .from('kandang')
        .insert([
          { 
            nama_kandang: formData.nama_kandang, 
            jenis_kandang: formData.jenis_kandang,
            kapasitas: formData.kapasitas
          }
        ])
        .select();

      if (error) {
        alert('Gagal menambahkan kandang: ' + error.message);
      } else {
        const newKandang = { ...data[0], babi: [] };
        setKandangList([newKandang, ...kandangList]);
        setIsAddModalOpen(false);
        setFormData({ nama_kandang: '', jenis_kandang: 'Indukan', kapasitas: 10 });
      }
    }
  };

  const openEditModal = (kandang: Kandang) => {
    setSelectedKandang(kandang);
    setIsEditMode(true);
    setFormData({
      nama_kandang: kandang.nama_kandang,
      jenis_kandang: kandang.jenis_kandang,
      kapasitas: kandang.kapasitas,
    });
    setIsAddModalOpen(true);
  };

  const handleDeleteKandang = async (id: string, nama: string) => {
    if (!window.confirm(`Apakah Anda yakin ingin menghapus ${nama}? Pastikan kandang ini sudah kosong karena jika masih ada babi di dalamnya, proses hapus bisa gagal atau data babi menjadi yatim.`)) return;
    
    const { error } = await supabase
      .from('kandang')
      .delete()
      .eq('id', id);

    if (error) {
      alert('Gagal menghapus kandang: ' + error.message);
    } else {
      setKandangList(kandangList.filter(k => k.id !== id));
    }
  };

  const openQRModal = (kandang: Kandang) => {
    setSelectedKandang(kandang);
    setIsQRModalOpen(true);
  };

  const handlePrintQR = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Manajemen Kandang</h1>
          <p className="text-muted-foreground mt-1">Kelola data kandang dan cetak QR Code.</p>
        </div>
        <button 
          onClick={() => {
            setIsEditMode(false);
            setFormData({ nama_kandang: '', jenis_kandang: 'Indukan', kapasitas: 10 });
            setIsAddModalOpen(true);
          }}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground font-medium rounded-lg hover:bg-primary/90 transition-colors shadow-sm"
        >
          <Plus className="w-5 h-5" />
          Tambah Kandang
        </button>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-4 bg-card border border-border p-3 rounded-xl shadow-sm print:hidden">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input 
            type="text" 
            placeholder="Cari kandang..." 
            className="w-full pl-9 pr-4 py-2 bg-background border border-input rounded-lg text-sm text-foreground focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>
        <select className="bg-background border border-input rounded-lg text-sm px-3 py-2 text-foreground focus:ring-2 focus:ring-primary focus:border-transparent">
          <option value="">Semua Jenis</option>
          <option value="Indukan">Indukan</option>
          <option value="Anak">Anak Babi</option>
          <option value="Pejantan">Pejantan</option>
          <option value="Pembesaran">Pembesaran</option>
        </select>
      </div>

      {/* Grid Kandang */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : kandangList.length === 0 ? (
        <div className="bg-card border border-dashed border-border rounded-xl p-12 text-center">
          <Home className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-medium text-foreground">Belum ada data kandang</h3>
          <p className="text-muted-foreground mt-1 mb-4">Tambahkan kandang pertama Anda untuk memulai.</p>
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="text-primary font-medium hover:underline"
          >
            + Tambah Kandang Sekarang
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 print:hidden">
          {kandangList.map((kandang) => (
            <div key={kandang.id} className="bg-card border border-border rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow group">
              <div className="p-5 border-b border-border">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-2.5 bg-primary/10 rounded-lg">
                    <Home className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex gap-1">
                    <button 
                      onClick={() => openEditModal(kandang)}
                      className="text-muted-foreground hover:text-primary p-1.5 rounded-md hover:bg-secondary transition-colors"
                      title="Edit Kandang"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleDeleteKandang(kandang.id, kandang.nama_kandang)}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10 p-1.5 rounded-md transition-colors"
                      title="Hapus Kandang"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <h3 className="text-xl font-bold text-foreground mb-1">{kandang.nama_kandang}</h3>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-secondary text-secondary-foreground border border-border">
                  {kandang.jenis_kandang}
                </span>
              </div>
              
              <div className="px-5 py-4 bg-secondary/30 grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Kapasitas</p>
                  <p className="font-semibold text-foreground">{kandang.kapasitas} Ekor</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Terisi</p>
                  <p className="font-semibold text-foreground">{kandang.babi ? kandang.babi.length : 0} Ekor</p>
                </div>
              </div>

              <div className="p-3 border-t border-border flex flex-col gap-2">
                <a 
                  href={`/dashboard/kandang/${kandang.id}`}
                  className="flex items-center justify-center w-full py-2 text-sm font-medium text-foreground bg-secondary hover:bg-secondary/80 rounded-lg transition-colors text-center border border-transparent"
                >
                  Detail Kandang & Babi
                </a>
                <div className="flex gap-2">
                  <a
                    href={`/dashboard/kandang/${kandang.id}`}
                    className="flex items-center justify-center gap-1.5 flex-1 py-2 text-sm font-medium text-emerald-600 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:hover:bg-emerald-500/20 rounded-lg transition-colors"
                  >
                    <SprayCan className="w-4 h-4" />
                    Sanitasi
                  </a>
                  <button 
                    onClick={() => openQRModal(kandang)}
                    className="flex items-center justify-center gap-1.5 flex-1 py-2 text-sm font-medium text-primary bg-primary/10 hover:bg-primary/20 rounded-lg transition-colors border border-transparent"
                  >
                    <QrCode className="w-4 h-4" />
                    QR Code
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Kandang Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm print:hidden">
          <div className="bg-card w-full max-w-md rounded-2xl shadow-xl border border-border overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-border bg-secondary/50">
              <h2 className="text-lg font-semibold text-foreground">
                {isEditMode ? 'Edit Kandang' : 'Tambah Kandang Baru'}
              </h2>
              <button 
                onClick={() => setIsAddModalOpen(false)}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddKandang} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Nama/Kode Kandang</label>
                <input
                  type="text"
                  required
                  value={formData.nama_kandang}
                  onChange={(e) => setFormData({...formData, nama_kandang: e.target.value})}
                  className="w-full px-3 py-2 bg-background border border-input rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-foreground"
                  placeholder="Contoh: K-IND-01"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Jenis Kandang</label>
                <select
                  value={formData.jenis_kandang}
                  onChange={(e) => setFormData({...formData, jenis_kandang: e.target.value})}
                  className="w-full px-3 py-2 bg-background border border-input rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-foreground"
                >
                  <option value="Indukan">Indukan</option>
                  <option value="Anak">Anak</option>
                  <option value="Pejantan">Pejantan</option>
                  <option value="Pembesaran">Pembesaran</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Kapasitas (Ekor)</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={formData.kapasitas}
                  onChange={(e) => setFormData({...formData, kapasitas: parseInt(e.target.value)})}
                  className="w-full px-3 py-2 bg-background border border-input rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-foreground"
                />
              </div>
              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 px-4 py-2.5 border border-border bg-background hover:bg-secondary text-foreground rounded-lg font-medium transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg font-medium transition-colors"
                >
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QR Code Print Modal */}
      {isQRModalOpen && selectedKandang && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-background/90 backdrop-blur-sm">
          {/* Only this section will be printed clearly using standard CSS media queries defined in globals.css if needed, but we'll use a simple approach */}
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden print:shadow-none print:w-full print:max-w-none print:h-screen print:flex print:flex-col print:justify-center print:items-center print:bg-white text-black">
            
            <div className="flex items-center justify-between p-4 border-b border-gray-200 print:hidden bg-gray-50">
              <h2 className="text-lg font-semibold text-gray-900">QR Code Kandang</h2>
              <button 
                onClick={() => setIsQRModalOpen(false)}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-8 text-center bg-white print:p-0">
              <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight mb-2 uppercase">
                {selectedKandang.nama_kandang}
              </h1>
              <p className="text-gray-500 font-medium mb-8 text-lg uppercase tracking-widest">
                KANDANG {selectedKandang.jenis_kandang}
              </p>
              
              <div className="inline-block p-4 border-4 border-gray-900 rounded-xl mb-8 bg-white">
                {/* Generate QR using an API for simplicity. The URL payload is the kandang ID or a specific route */}
                {/* e.g., https://smart-pig-farm.com/scan?id=... */}
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=https://app.smartpigfarm.com/dashboard/kandang/${selectedKandang.id}&margin=0`} 
                  alt={`QR Code ${selectedKandang.nama_kandang}`}
                  className="w-64 h-64 mx-auto"
                />
              </div>

              <div className="space-y-1 text-gray-600 mb-2">
                <p>Kapasitas: <strong>{selectedKandang.kapasitas} Ekor</strong></p>
                <p className="text-xs mt-4 text-gray-400">Scan untuk melihat data & histori kesehatan babi.</p>
              </div>
            </div>

            <div className="p-4 bg-gray-50 border-t border-gray-200 print:hidden">
              <button
                onClick={handlePrintQR}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-black text-white hover:bg-gray-800 rounded-lg font-medium transition-colors"
              >
                <Printer className="w-5 h-5" />
                Cetak Label QR
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Print Specific Styles injected safely */}
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body * {
            visibility: hidden;
          }
          .fixed.z-\\[60\\] * {
            visibility: visible;
          }
          .fixed.z-\\[60\\] {
            position: absolute;
            left: 0;
            top: 0;
            margin: 0;
            padding: 0;
            width: 100%;
          }
        }
      `}} />
    </div>
  );
}
