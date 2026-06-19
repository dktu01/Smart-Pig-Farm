'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { PiggyBank, Plus, Search, Activity, Calendar, Heart, MoreHorizontal, X, Stethoscope, Trash2, Edit } from 'lucide-react';

// Type definitions based on schema
type Kandang = {
  id: string;
  nama_kandang: string;
};

type Babi = {
  id: string;
  kode_babi: string;
  jenis_kelamin: string;
  tanggal_lahir: string;
  status_kesehatan: string;
  status_reproduksi: string;
  kandang_id: string;
  kandang: Kandang; // Joined data
};

export default function DataBabiPage() {
  const [babiList, setBabiList] = useState<Babi[]>([]);
  const [kandangList, setKandangList] = useState<Kandang[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isVaccinationModalOpen, setIsVaccinationModalOpen] = useState(false);
  const [vaccinationData, setVaccinationData] = useState({
    jenis_vaksin: '',
    tanggal_vaksin: new Date().toISOString().split('T')[0],
    tanggal_berikutnya: '',
    catatan: ''
  });
  // Health modal state
  const [isHealthModalOpen, setIsHealthModalOpen] = useState(false);
  const [selectedBabi, setSelectedBabi] = useState<Babi | null>(null);

  // Add Babi Form
  // Add Babi Form
  const [formData, setFormData] = useState({
    kode_babi: '',
    jenis_kelamin: 'Betina',
    tanggal_lahir: new Date().toISOString().split('T')[0],
    kandang_id: '',
    status_kesehatan: 'Sehat',
    status_reproduksi: 'Belum Kawin',
  });

  // New filter states for Indukan and health status
  const [categoryFilter, setCategoryFilter] = useState<'Semua' | 'Indukan'>('Semua');
  const [healthStatusFilter, setHealthStatusFilter] = useState<'Semua' | 'Sehat' | 'Sakit'>('Semua');

  // Add Health Record Form
  const [healthData, setHealthData] = useState({
    penyakit: '',
    obat_diberikan: '',
    status: 'Ringan',
    catatan: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    
    // Fetch Kandang for dropdown
    const { data: kandangData } = await supabase
      .from('kandang')
      .select('id, nama_kandang')
      .order('nama_kandang');
      
    if (kandangData) setKandangList(kandangData);
    if (kandangData && kandangData.length > 0 && !formData.kandang_id) {
      setFormData(prev => ({ ...prev, kandang_id: kandangData[0].id }));
    }

    // Fetch Babi with Kandang relation
    const { data: babiData, error } = await supabase
      .from('babi')
      .select(`
        *,
        kandang:kandang_id(id, nama_kandang)
      `)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching babi:', error);
    } else {
      setBabiList(babiData as any);
    }
    
    setLoading(false);
  };

  const handleAddBabi = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isEditMode && selectedBabi) {
      // Edit Mode
      const { data, error } = await supabase
        .from('babi')
        .update({
          kode_babi: formData.kode_babi,
          jenis_kelamin: formData.jenis_kelamin,
          tanggal_lahir: formData.tanggal_lahir,
          kandang_id: formData.kandang_id,
          status_reproduksi: formData.status_reproduksi
        })
        .eq('id', selectedBabi.id)
        .select(`
          *,
          kandang:kandang_id(id, nama_kandang)
        `);

      if (error) {
        alert('Gagal mengupdate babi: ' + error.message);
      } else {
        setBabiList(babiList.map(b => b.id === selectedBabi.id ? data[0] as any : b));
        setIsAddModalOpen(false);
        setIsEditMode(false);
        setSelectedBabi(null);
      }
    } else {
      // Add Mode
      const { data, error } = await supabase
        .from('babi')
        .insert([
          { 
            kode_babi: formData.kode_babi,
            jenis_kelamin: formData.jenis_kelamin,
            tanggal_lahir: formData.tanggal_lahir,
            kandang_id: formData.kandang_id,
            status_kesehatan: formData.status_kesehatan,
            status_reproduksi: formData.status_reproduksi
          }
        ])
        .select(`
          *,
          kandang:kandang_id(id, nama_kandang)
        `);

      if (error) {
        alert('Gagal menambahkan babi: ' + error.message);
      } else {
        setBabiList([data[0] as any, ...babiList]);
        setIsAddModalOpen(false);
        setFormData({ 
          ...formData, 
          kode_babi: '', 
          status_reproduksi: 'Belum Kawin'
        });
      }
    }
  };

  const openEditModal = (babi: Babi) => {
    setSelectedBabi(babi);
    setIsEditMode(true);
    setFormData({
      kode_babi: babi.kode_babi,
      jenis_kelamin: babi.jenis_kelamin,
      tanggal_lahir: babi.tanggal_lahir,
      kandang_id: babi.kandang_id,
      status_kesehatan: babi.status_kesehatan,
      status_reproduksi: babi.status_reproduksi,
    });
    setIsAddModalOpen(true);
  };

  const generateCode = () => {
    // Generate code based on gender and status reproduksi
    let prefix = 'PIG';
    if (formData.jenis_kelamin === 'Betina' && formData.status_reproduksi !== 'Belum Kawin') {
      prefix = 'IND'; // Indukan
    } else if (formData.jenis_kelamin === 'Jantan' && formData.status_reproduksi === 'Siap Kawin') {
      prefix = 'PEJ'; // Pejantan
    }
    
    // Create random 4 digit number
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    setFormData({ ...formData, kode_babi: `${prefix}-${randomNum}` });
  };

  const handleAddVaccinationRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBabi) return;

    const { error: vaccError } = await supabase
      .from('vaksinasi')
      .insert([
        {
          babi_id: selectedBabi.id,
          jenis_vaksin: vaccinationData.jenis_vaksin,
          tanggal_vaksin: vaccinationData.tanggal_vaksin,
          tanggal_berikutnya: vaccinationData.tanggal_berikutnya,
          catatan: vaccinationData.catatan
        }
      ]);

    if (vaccError) {
      alert('Gagal menyimpan vaksinasi: ' + vaccError.message);
      return;
    }
    // optionally update local state if you store vaccination info
    setIsVaccinationModalOpen(false);
    setVaccinationData({ jenis_vaksin: '', tanggal_vaksin: new Date().toISOString().split('T')[0], tanggal_berikutnya: '', catatan: '' });
    alert('Data vaksinasi berhasil disimpan!');
  };

  const handleAddHealthRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBabi) return;

    // 1. Insert riwayat kesehatan
    const { error: healthError } = await supabase
      .from('kesehatan')
      .insert([{
        babi_id: selectedBabi.id,
        penyakit: healthData.penyakit,
        obat_diberikan: healthData.obat_diberikan,
        catatan: healthData.catatan,
        status: healthData.status
      }]);

    if (healthError) {
      alert('Gagal menyimpan riwayat: ' + healthError.message);
      return;
    }

    // 2. Update status kesehatan babi
    const newStatus = healthData.status === 'Sembuh' ? 'Sehat' : `Sakit ${healthData.status}`;
    
    const { error: updateError } = await supabase
      .from('babi')
      .update({ status_kesehatan: newStatus })
      .eq('id', selectedBabi.id);

    if (!updateError) {
      // Update local state
      setBabiList(babiList.map(b => 
        b.id === selectedBabi.id 
          ? { ...b, status_kesehatan: newStatus } 
          : b
      ));
      setIsHealthModalOpen(false);
      setHealthData({ penyakit: '', obat_diberikan: '', status: 'Ringan', catatan: '' });
      alert('Status kesehatan berhasil diperbarui!');
    }
  };

  const getHealthColor = (status: string) => {
    if (status === 'Sehat') return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20';
    if (status.includes('Ringan')) return 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20';
    if (status.includes('Sedang')) return 'bg-orange-500/10 text-orange-600 border-orange-500/20';
    return 'bg-destructive/10 text-destructive border-destructive/20';
  };

  const handleDeleteBabi = async (id: string, kode: string) => {
    if (!window.confirm(`Apakah Anda yakin ingin menghapus babi dengan kode ${kode}? Semua data terkait (kesehatan, reproduksi) mungkin akan ikut terhapus atau menjadi yatim.`)) return;
    
    const { error } = await supabase
      .from('babi')
      .delete()
      .eq('id', id);

    if (error) {
      alert('Gagal menghapus data babi: ' + error.message);
    } else {
      setBabiList(babiList.filter(b => b.id !== id));
    }
  };

// Helper to calculate age in months
const calculateAge = (birthDate: string) => {
  const start = new Date(birthDate);
  const now = new Date();
  const months = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());
  return months === 0 ? '< 1 Bulan' : `${months} Bulan`;
};

// Compute filtered list based on selected filters
const filteredBabi = babiList.filter((b) => {
  const matchesCategory =
    categoryFilter === 'Semua' ||
    (categoryFilter === 'Indukan' && b.status_reproduksi !== 'Belum Kawin');
  const matchesHealth =
    healthStatusFilter === 'Semua' ||
    (healthStatusFilter === 'Sehat' && b.status_kesehatan === 'Sehat') ||
    (healthStatusFilter === 'Sakit' && b.status_kesehatan !== 'Sehat');
  return matchesCategory && matchesHealth;
});
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Data Babi</h1>
          <p className="text-muted-foreground mt-1">Kelola populasi, detail individu, dan pantau kesehatan ternak.</p>
        </div>
        <button 
          onClick={() => {
            setIsEditMode(false);
            setFormData({ ...formData, kode_babi: '', status_reproduksi: 'Belum Kawin' });
            setIsAddModalOpen(true);
          }}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground font-medium rounded-lg hover:bg-primary/90 transition-colors shadow-sm"
        >
          <Plus className="w-5 h-5" />
          Tambah Babi
        </button>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-4 bg-card border border-border p-3 rounded-xl shadow-sm">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input 
            type="text" 
            placeholder="Cari kode babi atau nama kandang..." 
            className="w-full pl-9 pr-4 py-2 bg-background border border-input rounded-lg text-sm text-foreground focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>
<select
  value={categoryFilter}
  onChange={(e) => setCategoryFilter(e.target.value as 'Semua' | 'Indukan')}
  className="bg-background border border-input rounded-lg text-sm px-3 py-2 text-foreground focus:ring-2 focus:ring-primary focus:border-transparent"
>
  <option value="Semua">Kategori: Semua</option>
  <option value="Indukan">Indukan (kawin)</option>
</select>
<select
  value={healthStatusFilter}
  onChange={(e) => setHealthStatusFilter(e.target.value as 'Semua' | 'Sehat' | 'Sakit')}
  className="bg-background border border-input rounded-lg text-sm px-3 py-2 text-foreground focus:ring-2 focus:ring-primary focus:border-transparent"
>
  <option value="Semua">Status: Semua</option>
  <option value="Sehat">Sehat</option>
  <option value="Sakit">Sakit</option>
</select>
      </div>

      {/* Table Data */}
            {/* Compute filtered list */}
      


      {/* Table Data */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : filteredBabi.length === 0 ? (
        <div className="bg-card border border-dashed border-border rounded-xl p-12 text-center">
          <PiggyBank className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-medium text-foreground">Belum ada data babi</h3>
          <p className="text-muted-foreground mt-1 mb-4">Tambahkan ternak pertama Anda ke dalam sistem.</p>
          {kandangList.length === 0 && (
            <p className="text-sm text-destructive mb-4">⚠️ Anda harus membuat kandang terlebih dahulu!</p>
          )}
          <button 
            onClick={() => setIsAddModalOpen(true)}
            disabled={kandangList.length === 0}
            className="text-primary font-medium hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
          >
            + Tambah Data Babi
          </button>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden flex flex-col">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-secondary/50 text-muted-foreground uppercase text-xs font-semibold tracking-wider">
                <tr>
                  <th className="px-6 py-4">Kode Babi</th>
                  <th className="px-6 py-4">Kandang</th>
                  <th className="px-6 py-4">Jenis Kelamin</th>
                  <th className="px-6 py-4">Umur</th>
                  <th className="px-6 py-4">Status Kesehatan</th>
                  <th className="px-6 py-4">Reproduksi</th>
                  <th className="px-6 py-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredBabi.map((babi) => (
                  <tr key={babi.id} className="hover:bg-secondary/30 transition-colors">
                    <td className="px-6 py-4 font-bold text-foreground">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                          <PiggyBank className="w-4 h-4" />
                        </div>
                        {babi.kode_babi}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-foreground">{babi.kandang?.nama_kandang || '-'}</td>
                    <td className="px-6 py-4 text-muted-foreground">{babi.jenis_kelamin}</td>
                    <td className="px-6 py-4 text-muted-foreground flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 opacity-70" />
                      {calculateAge(babi.tanggal_lahir)}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${getHealthColor(babi.status_kesehatan)}`}>
                        {babi.status_kesehatan === 'Sehat' ? <Activity className="w-3 h-3 mr-1" /> : <Stethoscope className="w-3 h-3 mr-1" />}
                        {babi.status_kesehatan}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                        <Heart className="w-4 h-4 text-pink-500 opacity-70" />
                        {babi.status_reproduksi || '-'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => {
                            setSelectedBabi(babi);
                            setIsVaccinationModalOpen(true);
                          }}
                          className="text-primary hover:bg-primary/10 px-3 py-1.5 rounded-md font-medium transition-colors border border-transparent"
                        >
                          Vaksin
                        </button>
                        <button 
                          onClick={() => openEditModal(babi)}
                          className="text-muted-foreground hover:text-primary p-1.5 rounded-md hover:bg-secondary transition-colors"
                          title="Edit"
                        >
                          <Edit className="w-5 h-5" />
                        </button>
                        <button 
                          onClick={() => handleDeleteBabi(babi.id, babi.kode_babi)}
                          className="text-destructive hover:bg-destructive/10 p-1.5 rounded-md transition-colors"
                          title="Hapus"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Tambah Babi */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="bg-card w-full max-w-md rounded-2xl shadow-xl border border-border overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-border bg-secondary/50">
              <h2 className="text-lg font-semibold text-foreground">
                {isEditMode ? 'Edit Data Babi' : 'Tambah Data Babi'}
              </h2>
              <button 
                onClick={() => setIsAddModalOpen(false)}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {kandangList.length === 0 ? (
              <div className="p-6 text-center">
                <p className="text-destructive mb-4">Anda belum memiliki kandang satupun.</p>
                <a href="/dashboard/kandang" className="text-primary hover:underline font-medium">Buat kandang terlebih dahulu</a>
              </div>
            ) : (
              <form onSubmit={handleAddBabi} className="p-5 space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-sm font-medium text-foreground">Kode / Tag Telinga</label>
                    <button 
                      type="button" 
                      onClick={generateCode}
                      className="text-xs font-medium text-primary hover:underline"
                    >
                      Generate Otomatis
                    </button>
                  </div>
                  <input
                    type="text"
                    required
                    value={formData.kode_babi}
                    onChange={(e) => setFormData({...formData, kode_babi: e.target.value})}
                    className="w-full px-3 py-2 bg-background border border-input rounded-lg focus:ring-2 focus:ring-primary text-foreground"
                    placeholder="Contoh: PIG-A001"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">Kandang</label>
                    <select
                      required
                      value={formData.kandang_id}
                      onChange={(e) => setFormData({...formData, kandang_id: e.target.value})}
                      className="w-full px-3 py-2 bg-background border border-input rounded-lg focus:ring-2 focus:ring-primary text-foreground"
                    >
                      {kandangList.map(k => (
                        <option key={k.id} value={k.id}>{k.nama_kandang}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">Jenis Kelamin</label>
                    <select
                      value={formData.jenis_kelamin}
                      onChange={(e) => setFormData({...formData, jenis_kelamin: e.target.value})}
                      className="w-full px-3 py-2 bg-background border border-input rounded-lg focus:ring-2 focus:ring-primary text-foreground"
                    >
                      <option value="Betina">Betina</option>
                      <option value="Jantan">Jantan</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">Tanggal Lahir / Beli</label>
                    <input
                      type="date"
                      required
                      value={formData.tanggal_lahir}
                      onChange={(e) => setFormData({...formData, tanggal_lahir: e.target.value})}
                      className="w-full px-3 py-2 bg-background border border-input rounded-lg focus:ring-2 focus:ring-primary text-foreground"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">Status Reproduksi</label>
                    <select
                      value={formData.status_reproduksi}
                      onChange={(e) => setFormData({...formData, status_reproduksi: e.target.value})}
                      className="w-full px-3 py-2 bg-background border border-input rounded-lg focus:ring-2 focus:ring-primary text-foreground"
                    >
                      <option value="Belum Kawin">Belum Kawin</option>
                      <option value="Siap Kawin">Siap Kawin</option>
                      {formData.jenis_kelamin === 'Betina' && (
                        <>
                          <option value="Bunting">Bunting</option>
                          <option value="Menyusui">Menyusui</option>
                        </>
                      )}
                    </select>
                  </div>
                </div>

        {/* Status Kesehatan */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Status Kesehatan
            </label>
            <select
              value={formData.status_kesehatan}
              onChange={(e) =>
                setFormData({ ...formData, status_kesehatan: e.target.value })
              }
              className="w-full px-3 py-2 bg-background border border-input rounded-lg focus:ring-2 focus:ring-primary text-foreground"
            >
              <option value="Sehat">Sehat</option>
              <option value="Sakit Ringan">Sakit Ringan</option>
              <option value="Sakit Sedang">Sakit Sedang</option>
              <option value="Sakit Parah">Sakit Parah</option>
            </select>
          </div>
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
                    Simpan Data
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Modal Input Vaksinasi */}
      {isVaccinationModalOpen && selectedBabi && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="bg-card w-full max-w-md rounded-2xl shadow-xl border border-border overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-border bg-primary/10">
              <div className="flex items-center gap-2">
                <Stethoscope className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-semibold text-primary">Tambah Vaksinasi: {selectedBabi.kode_babi}</h2>
              </div>
              <button 
                onClick={() => setIsVaccinationModalOpen(false)}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddVaccinationRecord} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Jenis Vaksin</label>
                <input
                  type="text"
                  required
                  value={vaccinationData.jenis_vaksin}
                  onChange={(e) => setVaccinationData({ ...vaccinationData, jenis_vaksin: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-input rounded-lg focus:ring-2 focus:ring-primary text-foreground"
                  placeholder="Contoh: Hog Cholera"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Tanggal Vaksin</label>
                  <input
                    type="date"
                    required
                    value={vaccinationData.tanggal_vaksin}
                    onChange={(e) => setVaccinationData({ ...vaccinationData, tanggal_vaksin: e.target.value })}
                    className="w-full px-3 py-2 bg-background border border-input rounded-lg focus:ring-2 focus:ring-primary text-foreground"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Tanggal Berikutnya</label>
                  <input
                    type="date"
                    value={vaccinationData.tanggal_berikutnya}
                    onChange={(e) => setVaccinationData({ ...vaccinationData, tanggal_berikutnya: e.target.value })}
                    className="w-full px-3 py-2 bg-background border border-input rounded-lg focus:ring-2 focus:ring-primary text-foreground"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Catatan</label>
                <textarea
                  value={vaccinationData.catatan}
                  onChange={(e) => setVaccinationData({ ...vaccinationData, catatan: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-input rounded-lg focus:ring-2 focus:ring-primary text-foreground resize-none"
                  rows={3}
                  placeholder="Catatan tambahan..."
                />
              </div>
              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsVaccinationModalOpen(false)}
                  className="flex-1 px-4 py-2.5 border border-border bg-background hover:bg-secondary text-foreground rounded-lg font-medium transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg font-medium transition-colors"
                >
                  Simpan Vaksinasi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Input Kesehatan */}
      {isHealthModalOpen && selectedBabi && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="bg-card w-full max-w-md rounded-2xl shadow-xl border border-border overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-border bg-destructive/10">
              <div className="flex items-center gap-2">
                <Stethoscope className="w-5 h-5 text-destructive" />
                <h2 className="text-lg font-semibold text-destructive">Catat Medis: {selectedBabi.kode_babi}</h2>
              </div>
              <button 
                onClick={() => setIsHealthModalOpen(false)}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleAddHealthRecord} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Indikasi Penyakit / Gejala</label>
                <input
                  type="text"
                  required
                  value={healthData.penyakit}
                  onChange={(e) => setHealthData({...healthData, penyakit: e.target.value})}
                  className="w-full px-3 py-2 bg-background border border-input rounded-lg focus:ring-2 focus:ring-primary text-foreground"
                  placeholder="Contoh: Diare, Demam, Cacingan..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Status Parah</label>
                  <select
                    value={healthData.status}
                    onChange={(e) => setHealthData({...healthData, status: e.target.value})}
                    className="w-full px-3 py-2 bg-background border border-input rounded-lg focus:ring-2 focus:ring-primary text-foreground"
                  >
                    <option value="Ringan">Sakit Ringan</option>
                    <option value="Sedang">Sakit Sedang</option>
                    <option value="Parah">Sakit Parah</option>
                    <option value="Sembuh">Sembuh</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Obat Diberikan</label>
                  <input
                    type="text"
                    value={healthData.obat_diberikan}
                    onChange={(e) => setHealthData({...healthData, obat_diberikan: e.target.value})}
                    className="w-full px-3 py-2 bg-background border border-input rounded-lg focus:ring-2 focus:ring-primary text-foreground"
                    placeholder="Contoh: Amoxicillin"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Catatan Tambahan</label>
                <textarea
                  value={healthData.catatan}
                  onChange={(e) => setHealthData({...healthData, catatan: e.target.value})}
                  className="w-full px-3 py-2 bg-background border border-input rounded-lg focus:ring-2 focus:ring-primary text-foreground resize-none"
                  rows={3}
                  placeholder="Tuliskan catatan monitoring..."
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsHealthModalOpen(false)}
                  className="flex-1 px-4 py-2.5 border border-border bg-background hover:bg-secondary text-foreground rounded-lg font-medium transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg font-medium transition-colors"
                >
                  Simpan Catatan Medis
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
