'use client';

// React & Next.js imports
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Third-party library imports (Lucide Icons)
import { 
  PiggyBank, 
  Plus, 
  Search, 
  Calendar, 
  Heart, 
  MoreHorizontal, 
  X, 
  Trash2, 
  Edit, 
  Syringe, 
  MapPin, 
  ChevronRight 
} from 'lucide-react';

// Local project imports (Supabase client)
import { supabase } from '@/lib/supabase';

// Definisi Tipe Data agar aman dari 'any'
interface Kandang {
  id: string;
  nama_kandang: string;
}

interface Babi {
  id: string;
  kode_babi: string;
  jenis_kelamin: string;
  tanggal_lahir: string;
  status_reproduksi: string;
  kandang_id: string;
  kandang: Kandang | null;
  vaksinasi?: { id: string }[];
  user_id?: string | null;
}

export default function DataBabiPage() {
  const router = useRouter();

  // State utama untuk data
  const [babiList, setBabiList] = useState<Babi[]>([]);
  const [kandangList, setKandangList] = useState<Kandang[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // State untuk manajemen Modal dan Aksi
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  const [isVaccinationModalOpen, setIsVaccinationModalOpen] = useState<boolean>(false);
  const [selectedBabi, setSelectedBabi] = useState<Babi | null>(null);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

  // State formulir tambah/edit babi
  const [formData, setFormData] = useState({
    kode_babi: '',
    jenis_kelamin: 'Betina',
    tanggal_lahir: new Date().toISOString().split('T')[0],
    kandang_id: '',
    status_reproduksi: 'Belum Kawin',
  });

  // State formulir catatan vaksinasi
  const [vaccinationData, setVaccinationData] = useState({
    jenis_vaksin: '',
    tanggal_vaksin: new Date().toISOString().split('T')[0],
    tanggal_berikutnya: '',
    catatan: ''
  });

  // State untuk pencarian dan filter kategori
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<'Semua' | 'Indukan'>('Semua');

  // Mengambil data saat komponen pertama kali dimuat
  useEffect(() => {
    fetchData();
  }, []);

  /**
   * Mengambil data babi dan kandang dari database Supabase
   * Menggunakan otentikasi user ID untuk memastikan keamanan multi-tenant
   */
  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      const userId = user?.id;

      if (!userId) {
        setKandangList([]);
        setBabiList([]);
        return;
      }

      // Mengambil data kandang untuk pilihan dropdown form
      const { data: kandangData, error: kandangErr } = await supabase
        .from('kandang')
        .select('id, nama_kandang')
        .eq('user_id', userId)
        .order('nama_kandang');

      if (kandangErr) throw kandangErr;
      if (kandangData) {
        setKandangList(kandangData as Kandang[]);
      }

      // Mengeset nilai default dropdown kandang pada form jika tersedia
      if (kandangData && kandangData.length > 0 && !formData.kandang_id) {
        setFormData(prev => ({ ...prev, kandang_id: kandangData[0].id }));
      }

      // Mengambil data babi beserta relasi kandang dan riwayat vaksinasinya
      const { data: babiData, error: babiErr } = await supabase
        .from('babi')
        .select(`
          *,
          kandang:kandang_id(id, nama_kandang),
          vaksinasi(id)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (babiErr) throw babiErr;
      
      if (babiData) {
        const typedBabiData = (babiData as unknown) as Babi[];
        setBabiList(typedBabiData);
      }
    } catch (error: unknown) {
      setBabiList([]);
      setKandangList([]);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Menyimpan data babi baru atau memperbarui data babi yang sudah ada (edit mode)
   */
  const handleAddBabi = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      const userId = user?.id;

      if (!userId) {
        alert('Session login tidak ditemukan. Silakan login ulang.');
        return;
      }

      if (isEditMode && selectedBabi) {
        // Mode Perbarui Data (Edit)
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
          .eq('user_id', userId)
          .select(`
            *,
            kandang:kandang_id(id, nama_kandang)
          `);

        if (error) throw error;
        
        if (data && data.length > 0) {
          const updatedBabi = (data[0] as unknown) as Babi;
          setBabiList(babiList.map(b => b.id === selectedBabi.id ? updatedBabi : b));
        }
        setIsAddModalOpen(false);
        setIsEditMode(false);
        setSelectedBabi(null);
      } else {
        // Mode Tambah Baru (Insert)
        const { data, error } = await supabase
          .from('babi')
          .insert([
            {
              kode_babi: formData.kode_babi,
              jenis_kelamin: formData.jenis_kelamin,
              tanggal_lahir: formData.tanggal_lahir,
              kandang_id: formData.kandang_id,
              status_reproduksi: formData.status_reproduksi,
              user_id: userId
            }
          ])
          .select(`
            *,
            kandang:kandang_id(id, nama_kandang)
          `);

        if (error) throw error;
        
        if (data && data.length > 0) {
          const newBabi = (data[0] as unknown) as Babi;
          setBabiList([newBabi, ...babiList]);
        }
        setIsAddModalOpen(false);
        setFormData({
          ...formData,
          kode_babi: '',
          status_reproduksi: 'Belum Kawin'
        });
      }
    } catch (error: unknown) {
      const err = error as Error;
      alert('Gagal menyimpan data babi: ' + err.message);
    }
  };

  /**
   * Menampilkan modal edit dengan data babi terpilih dimasukkan ke formulir
   */
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

  /**
   * Otomatis membuat kode identifikasi babi (tag telinga) berdasarkan jenis kelamin & reproduksi
   */
  const generateCode = () => {
    let prefix = 'PIG';
    if (formData.jenis_kelamin === 'Betina' && formData.status_reproduksi !== 'Belum Kawin') {
      prefix = 'IND'; // Indukan
    } else if (formData.jenis_kelamin === 'Jantan' && formData.status_reproduksi === 'Siap Kawin') {
      prefix = 'PEJ'; // Pejantan
    }

    const randomNum = Math.floor(1000 + Math.random() * 9000);
    setFormData({ ...formData, kode_babi: `${prefix}-${randomNum}` });
  };

  /**
   * Menyimpan catatan vaksinasi baru untuk individu babi terpilih
   */
  const handleAddVaccinationRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBabi) return;
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      const userId = user?.id;

      if (!userId) {
        alert('Session login tidak ditemukan. Silakan login ulang.');
        return;
      }

      const { error: vaccError } = await supabase
        .from('vaksinasi')
        .insert([
          {
            babi_id: selectedBabi.id,
            jenis_vaksin: vaccinationData.jenis_vaksin,
            tanggal_vaksin: vaccinationData.tanggal_vaksin,
            tanggal_berikutnya: vaccinationData.tanggal_berikutnya || null,
            catatan: vaccinationData.catatan,
            user_id: userId
          }
        ]);

      if (vaccError) throw vaccError;
      
      // Memperbarui jumlah vaksinasi lokal pada state agar UI langsung berubah
      setBabiList(prev => prev.map(b =>
        b.id === selectedBabi.id
          ? { ...b, vaksinasi: [...(b.vaksinasi || []), { id: 'new' }] }
          : b
      ));
      setIsVaccinationModalOpen(false);
      setVaccinationData({ 
        jenis_vaksin: '', 
        tanggal_vaksin: new Date().toISOString().split('T')[0], 
        tanggal_berikutnya: '', 
        catatan: '' 
      });
      alert('Data vaksinasi berhasil disimpan!');
    } catch (error: unknown) {
      const err = error as Error;
      alert('Gagal menyimpan vaksinasi: ' + err.message);
    }
  };

  /**
   * Menghapus data babi berdasarkan ID-nya dengan konfirmasi pengguna
   */
  const handleDeleteBabi = async (id: string, kode: string) => {
    if (!window.confirm(`Apakah Anda yakin ingin menghapus babi dengan kode ${kode}? Semua data terkait (kesehatan, reproduksi) mungkin akan ikut terhapus.`)) return;
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      const userId = user?.id;

      const { error } = await supabase
        .from('babi')
        .delete()
        .eq('id', id)
        .eq('user_id', userId ?? '');

      if (error) throw error;
      setBabiList(babiList.filter(b => b.id !== id));
    } catch (error: unknown) {
      const err = error as Error;
      alert('Gagal menghapus data babi: ' + err.message);
    }
  };

  /**
   * Menghitung umur babi dalam satuan bulan secara presisi
   */
  const calculateAge = (birthDate: string): string => {
    const start = new Date(birthDate);
    const now = new Date();
    const months = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());
    return months <= 0 ? '< 1 Bulan' : `${months} Bulan`;
  };

  // Memfilter list babi secara real-time berdasarkan input pencarian dan filter kategori reproduksi
  const filteredBabi = babiList
    .filter((b) => {
      const matchesCategory =
        categoryFilter === 'Semua' ||
        (categoryFilter === 'Indukan' && b.status_reproduksi !== 'Belum Kawin');

      const query = searchQuery.toLowerCase();
      const matchesSearch =
        b.kode_babi.toLowerCase().includes(query) ||
        (b.kandang?.nama_kandang || '').toLowerCase().includes(query);

      return matchesCategory && matchesSearch;
    })
    .sort((a, b) => {
      const kandangA = a.kandang?.nama_kandang || '';
      const kandangB = b.kandang?.nama_kandang || '';
      if (kandangA < kandangB) return -1;
      if (kandangA > kandangB) return 1;
      return a.kode_babi.localeCompare(b.kode_babi);
    });

  return (
    <div className="space-y-6">
      {/* Bagian Header Halaman */}
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

      {/* Toolbar Pencarian & Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 bg-card border border-border p-3 rounded-xl shadow-sm">
        <div className="relative flex-1 w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Cari kode babi atau nama kandang..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-background border border-input rounded-lg text-sm text-foreground focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value as 'Semua' | 'Indukan')}
          className="w-full sm:w-auto bg-background border border-input rounded-lg text-sm px-3 py-2 text-foreground focus:ring-2 focus:ring-primary focus:border-transparent"
        >
          <option value="Semua">Kategori: Semua</option>
          <option value="Indukan">Indukan (kawin)</option>
        </select>
      </div>

      {/* Grid / Tabel Data Babi */}
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
        <div className="bg-card border border-border rounded-xl shadow-sm overflow-visible flex flex-col">
          {/* Layer transparan untuk menutup dropdown kustom saat mengklik area luar */}
          {openDropdownId && (
            <div className="fixed inset-0 z-10" onClick={() => setOpenDropdownId(null)} />
          )}

          {/* Tampilan Desktop (Tabel) */}
          <div className="hidden md:block overflow-visible">
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
                {filteredBabi.map((babi) => (
                  <tr
                    key={babi.id}
                    onClick={() => { router.push(`/dashboard/babi/${babi.id}`); }}
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
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5" onClick={e => e.stopPropagation()}>
                        {/* Tombol Vaksin Cepat */}
                        <button
                          onClick={() => { setSelectedBabi(babi); setIsVaccinationModalOpen(true); }}
                          className="flex items-center gap-1.5 text-primary bg-primary/10 hover:bg-primary/20 px-2.5 py-1.5 rounded-lg transition-colors text-xs font-semibold border border-primary/20"
                          title="Catat Vaksinasi"
                        >
                          <Syringe className="w-3.5 h-3.5" />
                          Vaksin
                        </button>
                        
                        {/* Dropdown Kustom Opsi Lainnya */}
                        <div className="relative">
                          <button
                            onClick={() => setOpenDropdownId(openDropdownId === babi.id ? null : babi.id)}
                            className="text-muted-foreground hover:text-foreground p-2 rounded-lg hover:bg-secondary transition-colors"
                            title="Opsi lainnya"
                          >
                            <MoreHorizontal className="w-4 h-4" />
                          </button>
                          {openDropdownId === babi.id && (
                            <div className="absolute right-0 top-full mt-1 w-40 bg-card border border-border rounded-xl shadow-xl z-50 overflow-hidden">
                              <button
                                onClick={() => { setOpenDropdownId(null); openEditModal(babi); }}
                                className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-foreground hover:bg-secondary transition-colors text-left"
                              >
                                <Edit className="w-4 h-4 text-muted-foreground" />
                                Edit Data
                              </button>
                              <div className="h-px bg-border mx-2" />
                              <button
                                onClick={() => { setOpenDropdownId(null); handleDeleteBabi(babi.id, babi.kode_babi); }}
                                className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-destructive hover:bg-destructive/10 transition-colors text-left"
                              >
                                <Trash2 className="w-4 h-4" />
                                Hapus
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Tampilan Mobile (Card List) */}
          <div className="grid gap-3 md:hidden p-4">
            {filteredBabi.map((babi) => (
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
                      Kandang: {babi.kandang?.nama_kandang || '-'}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">{babi.status_reproduksi || '-'}</p>
                  </div>
                </div>

                {/* Tombol Vaksin Terapung pada Tampilan Card Mobile */}
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
            ))}
          </div>
        </div>
      )}

      {/* Modal Tambah/Edit Babi */}
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
                <button 
                  onClick={() => { setIsAddModalOpen(false); router.push('/dashboard/kandang'); }} 
                  className="text-primary hover:underline font-medium"
                >
                  Buat kandang terlebih dahulu
                </button>
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
      )}

      {/* Modal Input Catatan Vaksinasi */}
      {isVaccinationModalOpen && selectedBabi && (
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
      )}
    </div>
  );
}
