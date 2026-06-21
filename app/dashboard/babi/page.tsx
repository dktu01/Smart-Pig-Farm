'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { PiggyBank, Plus, Search, Calendar, Heart, MoreHorizontal, X, Trash2, Edit, Syringe, MapPin, ChevronRight } from 'lucide-react';

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
  kandang: Kandang;
  vaksinasi?: { id: string }[]; // count from join
};

export default function DataBabiPage() {
  const router = useRouter();
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
  const [selectedBabi, setSelectedBabi] = useState<Babi | null>(null);
  // Dropdown menu state per row
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

  // Add Babi Form
  // Add Babi Form
  const [formData, setFormData] = useState({
    kode_babi: '',
    jenis_kelamin: 'Betina',
    tanggal_lahir: new Date().toISOString().split('T')[0],
    kandang_id: '',
    status_reproduksi: 'Belum Kawin',
  });

  // New filter states for Indukan and health status
  const [categoryFilter, setCategoryFilter] = useState<'Semua' | 'Indukan'>('Semua');

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

    // Fetch Babi with Kandang relation AND vaksinasi count
    const { data: babiData, error } = await supabase
      .from('babi')
      .select(`
        *,
        kandang:kandang_id(id, nama_kandang),
        vaksinasi(id)
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
    // Update local vaksinasi count
    setBabiList(prev => prev.map(b =>
      b.id === selectedBabi.id
        ? { ...b, vaksinasi: [...(b.vaksinasi || []), { id: 'new' }] }
        : b
    ));
    setIsVaccinationModalOpen(false);
    setVaccinationData({ jenis_vaksin: '', tanggal_vaksin: new Date().toISOString().split('T')[0], tanggal_berikutnya: '', catatan: '' });
    alert('Data vaksinasi berhasil disimpan!');
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

  // Helper: get vaksin status badge config from count
  const getVaksinStatus = (babi: Babi) => {
    const count = babi.vaksinasi?.length ?? 0;
    if (count === 0) return { label: 'Belum Vaksin', className: 'bg-destructive/10 text-destructive border-destructive/20' };
    if (count === 1) return { label: 'Vaksinasi 1×', className: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20 dark:text-yellow-400' };
    if (count === 2) return { label: 'Vaksinasi 2×', className: 'bg-blue-500/10 text-blue-600 border-blue-500/20 dark:text-blue-400' };
    return { label: 'Vaksin Lengkap', className: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' };
  };

  const filteredBabi = babiList.filter((b) => {
    const matchesCategory =
      categoryFilter === 'Semua' ||
      (categoryFilter === 'Indukan' && b.status_reproduksi !== 'Belum Kawin');
    return matchesCategory;
  }).sort((a, b) => {
    const kandangA = a.kandang?.nama_kandang || '';
    const kandangB = b.kandang?.nama_kandang || '';
    if (kandangA < kandangB) return -1;
    if (kandangA > kandangB) return 1;
    return a.kode_babi.localeCompare(b.kode_babi);
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
          {/* Close dropdown on outside click */}
          {openDropdownId && (
            <div className="fixed inset-0 z-10" onClick={() => setOpenDropdownId(null)} />
          )}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-secondary/50 text-muted-foreground uppercase text-xs font-semibold tracking-wider">
                <tr>
                  <th className="px-6 py-4">Identitas</th>
                  <th className="px-6 py-4">Profil</th>
                  <th className="px-6 py-4">Reproduksi</th>
                  <th className="px-6 py-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredBabi.map((babi) => {
                  return (
                    <tr
                      key={babi.id}
                      onClick={() => { window.location.href = `/dashboard/babi/${babi.id}`; }}
                      className="hover:bg-secondary/30 transition-colors cursor-pointer group"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                            <PiggyBank className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="font-bold text-foreground text-base">{babi.kode_babi}</p>
                            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                              <MapPin className="w-3 h-3" /> {babi.kandang?.nama_kandang || '-'}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          <span className="font-medium text-foreground">{babi.jenis_kelamin}</span>
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Calendar className="w-3 h-3" /> {calculateAge(babi.tanggal_lahir)}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1.5 text-sm text-foreground font-medium">
                          <Heart className="w-4 h-4 text-pink-500" />
                          {babi.status_reproduksi || '-'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-1.5" onClick={e => e.stopPropagation()}>
                          {/* Vaksin button — always visible */}
                          <button
                            onClick={() => { setSelectedBabi(babi); setIsVaccinationModalOpen(true); }}
                            className="flex items-center gap-1.5 text-primary bg-primary/10 hover:bg-primary/20 px-2.5 py-1.5 rounded-lg transition-colors text-xs font-semibold border border-primary/20"
                            title="Catat Vaksinasi"
                          >
                            <Syringe className="w-3.5 h-3.5" />
                            Vaksin
                          </button>
                          {/* ... dropdown for Edit & Delete */}
                          <div className="relative">
                            <button
                              onClick={() => setOpenDropdownId(openDropdownId === babi.id ? null : babi.id)}
                              className="text-muted-foreground hover:text-foreground p-2 rounded-lg hover:bg-secondary transition-colors"
                              title="Opsi lainnya"
                            >
                              <MoreHorizontal className="w-4 h-4" />
                            </button>
                            {openDropdownId === babi.id && (
                              <div className="absolute right-0 top-full mt-1 w-40 bg-card border border-border rounded-xl shadow-xl z-20 overflow-hidden">
                                <button
                                  onClick={() => { setOpenDropdownId(null); openEditModal(babi); }}
                                  className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-foreground hover:bg-secondary transition-colors"
                                >
                                  <Edit className="w-4 h-4 text-muted-foreground" />
                                  Edit Data
                                </button>
                                <div className="h-px bg-border mx-2" />
                                <button
                                  onClick={() => { setOpenDropdownId(null); handleDeleteBabi(babi.id, babi.kode_babi); }}
                                  className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-destructive hover:bg-destructive/10 transition-colors"
                                >
                                  <Trash2 className="w-4 h-4" />
                                  Hapus
                                </button>
                              </div>
                            )}
                          </div>
                          {/* Mobile row arrow hint */}
                          <ChevronRight className="w-4 h-4 text-muted-foreground/40 md:hidden" />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="grid gap-3 md:hidden p-4">
            {filteredBabi.map((babi) => {
              return (
                <div
                  key={babi.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => router.push(`/dashboard/babi/${babi.id}`)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      router.push(`/dashboard/babi/${babi.id}`);
                    }
                  }}
                  className="relative rounded-2xl border border-border bg-card p-4 shadow-sm active:scale-[0.99] transition-transform"
                >
                  <div className="flex items-start gap-3 pr-12">
                    <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                      <PiggyBank className="w-5 h-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-foreground text-base truncate">{babi.kode_babi}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">
                        {babi.kandang?.nama_kandang || '-'}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">{babi.status_reproduksi || '-'}</p>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between gap-3">
                    <div className="text-xs text-muted-foreground">Kode Kandang: {babi.kandang?.nama_kandang || '-'}</div>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedBabi(babi);
                      setIsVaccinationModalOpen(true);
                    }}
                    className="absolute bottom-4 right-4 w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg active:scale-95 transition-transform"
                    aria-label={`Input vaksin untuk ${babi.kode_babi}`}
                    title="Input Vaksin"
                  >
                    <Syringe className="w-5 h-5" />
                  </button>
                </div>
              );
            })}
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
                onChange={(e) => setFormData({ ...formData, kode_babi: e.target.value })}
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
                  onChange={(e) => setFormData({ ...formData, kandang_id: e.target.value })}
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
                  onChange={(e) => setFormData({ ...formData, jenis_kelamin: e.target.value })}
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
                  onChange={(e) => setFormData({ ...formData, tanggal_lahir: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-input rounded-lg focus:ring-2 focus:ring-primary text-foreground"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Status Reproduksi</label>
                <select
                  value={formData.status_reproduksi}
                  onChange={(e) => setFormData({ ...formData, status_reproduksi: e.target.value })}
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
  )
}

{/* Modal Input Vaksinasi */ }
{
  isVaccinationModalOpen && selectedBabi && (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
      <div className="bg-card w-full max-w-md rounded-2xl shadow-xl border border-border overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-border bg-primary/10">
            <h2 className="text-lg font-semibold text-primary">Tambah Vaksinasi: {selectedBabi.kode_babi}</h2>
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
  )
}

    </div>
  );
}
