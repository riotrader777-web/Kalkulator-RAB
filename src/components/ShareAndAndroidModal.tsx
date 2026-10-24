import React, { useState, useEffect } from 'react';
import { 
  X, 
  Share2, 
  Smartphone, 
  Download, 
  Copy, 
  Check, 
  ExternalLink, 
  MessageSquare, 
  QrCode, 
  Sparkles,
  AlertTriangle,
  Globe,
  UploadCloud,
  ArrowRight
} from 'lucide-react';

interface ShareAndAndroidModalProps {
  isOpen: boolean;
  onClose: () => void;
  appUrl?: string;
}

export const ShareAndAndroidModal: React.FC<ShareAndAndroidModalProps> = ({
  isOpen,
  onClose,
  appUrl,
}) => {
  const [activeTab, setActiveTab] = useState<'error_info' | 'share' | 'pwa' | 'apk'>('error_info');
  const [copied, setCopied] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [customUrl, setCustomUrl] = useState('');

  // Determine current active URL
  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : '';
  const effectiveUrl = customUrl.trim() || appUrl || currentOrigin || 'https://kalkulator-rab-rumah.web.app';

  // Listen to beforeinstallprompt event for direct native Android PWA install prompt
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    if (typeof window !== 'undefined' && window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  if (!isOpen) return null;

  const handleCopyLink = (textToCopy: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(
      `Halo! Berikut tautan aplikasi Kalkulator RAB Bangun Rumah Pro (Hitung otomatis biaya rumah 1 & 2 lantai, semen 50kg, denah interaktif, dan pilihan borongan upah vs bahan): ${effectiveUrl}`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  const handleTriggerInstall = async () => {
    if (installPrompt) {
      installPrompt.prompt();
      const choiceResult = await installPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        setIsInstalled(true);
      }
      setInstallPrompt(null);
    } else {
      alert(
        'Petunjuk Instalasi di HP Android:\n1. Buka tautan ini di browser Google Chrome pada HP.\n2. Ketuk ikon titik 3 (⋮) di pojok kanan atas.\n3. Pilih "Instal aplikasi" atau "Tambahkan ke Layar Utama".'
      );
    }
  };

  const qrSvgUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(effectiveUrl)}&bgcolor=ffffff&color=0f172a&margin=6`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* MODAL HEADER */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-amber-950 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Panduan Akses Publik & APK Android</h3>
              <p className="text-xs text-slate-300">Solusi error "Page not found", bagikan ke orang lain, dan pasang di HP</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* TABS NAVIGATION */}
        <div className="flex border-b border-slate-200 bg-slate-50 text-xs font-semibold px-3 pt-2 gap-1 sm:gap-2 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('error_info')}
            className={`pb-2.5 px-3 border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'error_info'
                ? 'border-rose-600 text-rose-800 font-bold bg-white rounded-t-lg'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
            <span>Solusi "Page not found"</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('share')}
            className={`pb-2.5 px-3 border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'share'
                ? 'border-amber-600 text-amber-800 font-bold bg-white rounded-t-lg'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Cara Deploy Publik (Gratis)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('pwa')}
            className={`pb-2.5 px-3 border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'pwa'
                ? 'border-amber-600 text-amber-800 font-bold bg-white rounded-t-lg'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Pasang di HP (PWA)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('apk')}
            className={`pb-2.5 px-3 border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'apk'
                ? 'border-amber-600 text-amber-800 font-bold bg-white rounded-t-lg'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>Buat File .APK Fisik</span>
          </button>
        </div>

        {/* TAB CONTENTS (SCROLLABLE) */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs text-slate-700 flex-1">
          {/* TAB 0: KENAPA PAGE NOT FOUND & BAGAIMANA MENGATASINYA */}
          {activeTab === 'error_info' && (
            <div className="space-y-4">
              <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 text-rose-950">
                <div className="flex items-center gap-2 font-bold text-sm mb-1.5 text-rose-900">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>Kenapa Saat Dibagikan ke Orang Lain Muncul "Page not found"?</span>
                </div>
                <p className="text-xs text-rose-900/90 leading-relaxed">
                  Penyebab utamanya adalah: <strong>Link yang Anda salin dari bilah alamat browser saat ini adalah link Preview Sesi Developer (Internal Cloud Sandbox / Workspace Pribadi)</strong>. 
                </p>
                <div className="mt-3 p-3 bg-white/80 rounded-lg border border-rose-200 text-xs space-y-1.5 text-slate-800">
                  <div className="font-semibold text-rose-950 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-600 inline-block"></span>
                    <span>Hanya Bisa Dibuka Akun Pemilik (Private):</span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed pl-3">
                    Server Google memproteksi sesi editor Anda. Ketika orang lain (di HP atau laptop mereka yang tidak login akun Anda) mencoba membuka URL preview internal tersebut, Google langsung memblokirnya dan menampilkan pesan <strong>"Page not found"</strong> atau <strong>"404 / 403 Forbidden"</strong>.
                  </p>
                </div>
              </div>

              {/* 2 SOLUSI AGAR BISA DIAKSES ORANG LAIN */}
              <div className="space-y-3">
                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-600" />
                  <span>2 Cara Agar Orang Lain Bisa Membuka Tanpa Error:</span>
                </h4>

                {/* Solusi 1 */}
                <div className="p-4 rounded-xl border-2 border-emerald-300 bg-emerald-50/50 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-emerald-950 text-xs flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-emerald-600 text-white font-bold text-[11px] flex items-center justify-center">1</span>
                      <span>Deploy ke Vercel / Netlify (Paling Mudah, Gratis & 100% Permanen)</span>
                    </span>
                    <span className="px-2 py-0.5 rounded bg-emerald-200 text-emerald-900 text-[10px] font-bold">
                      Rekomendasi
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-700 leading-relaxed">
                    Aplikasi ini adalah <strong>Single Page Application (React + Vite)</strong> yang sudah siap rilis. Anda bisa mengunggahnya ke hosting gratis seperti <strong>Vercel</strong> atau <strong>Netlify</strong>. Dalam 2 menit, Anda akan mendapatkan alamat web permanen seperti:
                  </p>
                  <div className="p-2 bg-white rounded-lg border border-emerald-300 font-mono text-emerald-800 text-xs font-semibold select-all">
                    https://kalkulator-rab-rumah.vercel.app
                  </div>
                  <p className="text-[10px] text-slate-500">
                    *Alamat ini bisa dibuka oleh ribuan orang sekaligus lewat HP Android, iPhone, maupun PC tanpa pernah error "Page not found".
                  </p>
                  <button
                    type="button"
                    onClick={() => setActiveTab('share')}
                    className="mt-1 text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 underline cursor-pointer"
                  >
                    <span>Lihat langkah-langkah deploy 2 menit di tab "Cara Deploy Publik"</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Solusi 2 */}
                <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2">
                  <div className="font-bold text-slate-900 text-xs flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-slate-900 text-white font-bold text-[11px] flex items-center justify-center">2</span>
                    <span>Gunakan Tombol "Deploy" / "Share App" Resmi di Pojok Atas AI Studio</span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Periksa menu bar di bagian atas AI Studio. Jika terdapat tombol <strong>"Publish"</strong>, <strong>"Share"</strong>, atau <strong>"Deploy"</strong>, klik tombol tersebut untuk membuat tautan publik resmi yang dapat diakses oleh publik.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 1: PANDUAN DEPLOY KE HOSTING GRATIS (VERCEL / NETLIFY) */}
          {activeTab === 'share' && (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-blue-950">
                <div className="flex items-center gap-2 font-bold text-xs mb-1">
                  <UploadCloud className="w-4 h-4 text-blue-700" />
                  <span>Panduan Deploy Gratis & Cepat ke Vercel / Netlify (2 Menit)</span>
                </div>
                <p className="text-[11px] text-blue-900/90 leading-relaxed">
                  Dengan mendeploy ke hosting publik, aplikasi RAB Anda akan online 24 jam nonstop, memiliki SSL HTTPS aman, dan bisa dibagikan ke tukang, klien, atau keluarga tanpa error.
                </p>
              </div>

              <div className="space-y-2.5">
                <div className="p-3 bg-white border border-slate-200 rounded-lg space-y-1">
                  <div className="font-bold text-slate-900 flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-slate-900 text-white text-[10px] flex items-center justify-center font-bold">1</span>
                    <span>Download Source Code Project</span>
                  </div>
                  <p className="text-[11px] text-slate-600 pl-6.5">
                    Download atau export project ini (atau push ke akun <strong>GitHub</strong> Anda).
                  </p>
                </div>

                <div className="p-3 bg-white border border-slate-200 rounded-lg space-y-1">
                  <div className="font-bold text-slate-900 flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-slate-900 text-white text-[10px] flex items-center justify-center font-bold">2</span>
                    <span>Buka Vercel.com atau Netlify.com</span>
                  </div>
                  <p className="text-[11px] text-slate-600 pl-6.5">
                    Daftar akun gratis di <a href="https://vercel.com" target="_blank" rel="noreferrer" className="text-blue-600 underline font-semibold">Vercel.com</a> atau <a href="https://netlify.com" target="_blank" rel="noreferrer" className="text-blue-600 underline font-semibold">Netlify.com</a> menggunakan akun Google / GitHub Anda.
                  </p>
                </div>

                <div className="p-3 bg-white border border-slate-200 rounded-lg space-y-1">
                  <div className="font-bold text-slate-900 flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-slate-900 text-white text-[10px] flex items-center justify-center font-bold">3</span>
                    <span>Impor Project & Klik Deploy</span>
                  </div>
                  <p className="text-[11px] text-slate-600 pl-6.5">
                    Pilih repository project Anda. Vercel/Netlify otomatis mendeteksi konfigurasi <strong>Vite</strong> (Build command: <code className="bg-slate-100 px-1 py-0.5 rounded text-[10px]">npm run build</code>, Output directory: <code className="bg-slate-100 px-1 py-0.5 rounded text-[10px]">dist</code>). Klik <strong>Deploy</strong>!
                  </p>
                </div>

                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg space-y-1">
                  <div className="font-bold text-emerald-950 flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-emerald-600 text-white text-[10px] flex items-center justify-center font-bold">✓</span>
                    <span>Selesai! Link Publik Anda Siap Digunakan</span>
                  </div>
                  <p className="text-[11px] text-emerald-800 pl-6.5">
                    Anda akan mendapatkan link seperti <code className="font-mono font-bold">https://nama-proyek-anda.vercel.app</code> yang bisa dibuka siapa saja di seluruh dunia.
                  </p>
                </div>
              </div>

              {/* Input URL jika sudah deploy agar bisa test QR & Share WA */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <label className="block text-xs font-bold text-slate-800">
                  Masukkan Link Publik Anda (untuk Buat QR Code & Share WA):
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="url"
                    placeholder="Contoh: https://rab-rumahku.vercel.app"
                    value={customUrl}
                    onChange={(e) => setCustomUrl(e.target.value)}
                    className="flex-1 px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white text-slate-800 font-mono focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                  />
                  {customUrl && (
                    <button
                      type="button"
                      onClick={() => setCustomUrl('')}
                      className="px-2 py-1 text-slate-400 hover:text-slate-600 text-xs font-semibold cursor-pointer"
                    >
                      Reset
                    </button>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => handleCopyLink(effectiveUrl)}
                    className={`flex-1 w-full py-2 px-3 rounded-lg font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      copied 
                        ? 'bg-emerald-600 text-white shadow-xs' 
                        : 'bg-slate-900 text-white hover:bg-slate-800'
                    }`}
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Link Tersalin!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Salin Link</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleShareWhatsApp}
                    className="flex-1 w-full py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-all flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Bagikan ke WhatsApp</span>
                  </button>
                </div>
              </div>

              {/* QR Code */}
              <div className="p-3.5 rounded-xl border border-slate-200 bg-white flex flex-col sm:flex-row items-center gap-4">
                <img
                  src={qrSvgUrl}
                  alt="QR Code Aplikasi RAB"
                  className="w-24 h-24 bg-white p-1 rounded-lg border border-slate-300 shadow-2xs shrink-0"
                  loading="lazy"
                />
                <div className="space-y-1 text-center sm:text-left">
                  <span className="font-bold text-slate-900 text-xs flex items-center justify-center sm:justify-start gap-1">
                    <QrCode className="w-4 h-4 text-amber-600" />
                    <span>Scan QR Code dari Kamera HP</span>
                  </span>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Arahkan kamera smartphone Android atau iPhone Anda ke barcode ini untuk langsung membuka aplikasi di ponsel Anda.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: INSTALL DI HP ANDROID (PWA) */}
          {activeTab === 'pwa' && (
            <div className="space-y-4">
              <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-4 text-amber-950">
                <div className="flex items-center gap-2 font-bold text-xs mb-1">
                  <Sparkles className="w-4 h-4 text-amber-700" />
                  <span>Metode Terbaik & Paling Ringan: Pasang Langsung di HP Android (PWA)</span>
                </div>
                <p className="text-[11px] text-amber-900/90 leading-relaxed">
                  Aplikasi ini <strong>sudah dilengkapi teknologi PWA (Progressive Web App)</strong> berstandar Google (lengkap dengan manifest, ikon resolusi tinggi, dan service worker). Anda <strong>tidak perlu mendownload file APK besar</strong> yang memakan kuota dan memori, melainkan bisa langsung dipasang menjadi aplikasi layar beranda!
                </p>
              </div>

              {installPrompt && (
                <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl flex items-center justify-between gap-3">
                  <span className="text-xs font-semibold text-emerald-950">
                    Browser Anda mendukung pemasangan instan 1-klik:
                  </span>
                  <button
                    type="button"
                    onClick={handleTriggerInstall}
                    className="px-3.5 py-1.5 bg-emerald-600 text-white rounded-lg font-bold text-xs hover:bg-emerald-700 shadow-xs cursor-pointer"
                  >
                    Pasang Sekarang di HP
                  </button>
                </div>
              )}

              {/* Langkah-langkah Pasang di HP Android */}
              <div className="space-y-2">
                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                  3 Langkah Memasang di HP Android (Google Chrome):
                </h4>
                
                <div className="space-y-2">
                  <div className="flex items-start gap-3 p-3 rounded-lg border border-slate-200 bg-white">
                    <div className="w-6 h-6 rounded-full bg-amber-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                      1
                    </div>
                    <div>
                      <div className="font-bold text-slate-900">Buka Link di Google Chrome Android</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        Buka tautan website aplikasi di browser Google Chrome pada HP Android Anda.
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 rounded-lg border border-slate-200 bg-white">
                    <div className="w-6 h-6 rounded-full bg-amber-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                      2
                    </div>
                    <div>
                      <div className="font-bold text-slate-900">Ketuk Ikon Menu Titik Tiga (⋮)</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        Di pojok kanan atas layar browser Chrome, ketuk tombol menu titik tiga (⋮).
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 rounded-lg border border-slate-200 bg-white">
                    <div className="w-6 h-6 rounded-full bg-amber-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                      3
                    </div>
                    <div>
                      <div className="font-bold text-slate-900">Pilih "Instal Aplikasi" / "Tambahkan ke Layar Utama"</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        Ketuk menu <strong>"Instal aplikasi"</strong> (atau <em>Add to Home screen</em>).
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 rounded-lg border border-emerald-200 bg-emerald-50/50">
                    <div className="w-6 h-6 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                      ✓
                    </div>
                    <div>
                      <div className="font-bold text-emerald-950">Aplikasi Terpasang di Layar Depan HP!</div>
                      <div className="text-[11px] text-emerald-800 mt-0.5">
                        Ikon "RAB Rumah" akan muncul di layar menu HP Anda, terbuka secara layar penuh tanpa bar browser, dan bekerja sangat cepat.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: CARA BIKIN FILE .APK */}
          {activeTab === 'apk' && (
            <div className="space-y-4">
              <div className="bg-slate-100 rounded-xl p-4 border border-slate-200">
                <div className="flex items-center gap-2 font-bold text-xs text-slate-900 mb-1">
                  <Download className="w-4 h-4 text-blue-600" />
                  <span>Apakah Bisa Dibuatkan File Installer .APK Fisik?</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  <strong>BISA!</strong> Karena aplikasi ini sudah memiliki berkas <strong>Web Manifest</strong>, <strong>Service Worker</strong>, dan <strong>Ikon Android (192px & 512px)</strong>, Anda bisa mengubah link web aplikasi ini menjadi file <strong>.APK resmi</strong> yang siap di-install di Android atau dikirim via WhatsApp.
                </p>
              </div>

              <div className="space-y-2.5">
                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                  Cara Membuat File .APK dengan PWABuilder (Gratis & Resmi Microsoft):
                </h4>

                <div className="p-3 bg-white border border-slate-200 rounded-lg space-y-1">
                  <div className="font-bold text-slate-900 flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-slate-900 text-white text-[10px] flex items-center justify-center font-bold">1</span>
                    <span>Pastikan Aplikasi Sudah Punya Link Publik</span>
                  </div>
                  <p className="text-[11px] text-slate-600 pl-6.5">
                    Pastikan Anda sudah mendeploy aplikasi ke Vercel/Netlify agar memiliki URL publik aktif (contoh: <code className="bg-slate-100 px-1 py-0.5 rounded text-[10px] font-mono">https://rab-rumahku.vercel.app</code>).
                  </p>
                </div>

                <div className="p-3 bg-white border border-slate-200 rounded-lg space-y-1">
                  <div className="font-bold text-slate-900 flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-slate-900 text-white text-[10px] flex items-center justify-center font-bold">2</span>
                    <span>Buka PWABuilder.com</span>
                  </div>
                  <p className="text-[11px] text-slate-600 pl-6.5">
                    Kunjungi situs <a href="https://www.pwabuilder.com" target="_blank" rel="noreferrer" className="text-amber-700 font-bold underline">www.pwabuilder.com</a>. Masukkan URL aplikasi Anda lalu klik <strong>"Start"</strong>.
                  </p>
                </div>

                <div className="p-3 bg-white border border-slate-200 rounded-lg space-y-1">
                  <div className="font-bold text-slate-900 flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-slate-900 text-white text-[10px] flex items-center justify-center font-bold">3</span>
                    <span>Klik "Package for Stores" & Pilih Android</span>
                  </div>
                  <p className="text-[11px] text-slate-600 pl-6.5">
                    PWABuilder akan memvalidasi manifest. Klik <strong>"Package For Stores"</strong>, pilih <strong>Android</strong>, lalu unduh berkas zip yang berisi file <strong>.apk</strong> dan <strong>.aab</strong>!
                  </p>
                </div>
              </div>

              <div className="pt-2">
                <a
                  href={`https://www.pwabuilder.com/?url=${encodeURIComponent(effectiveUrl)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                >
                  <span>Buka PWABuilder untuk Generate File .APK</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-[11px] text-slate-600">
                <div className="font-bold text-slate-800 mb-0.5">Opsi Tambahan untuk Developer:</div>
                Jika Anda ingin mengompilasi APK langsung dari source code, Anda dapat menggunakan library <strong>Capacitor</strong> (<code className="font-mono text-slate-700">npm i @capacitor/core @capacitor/android</code>) atau Google <strong>Bubblewrap CLI</strong> untuk menghasilkan APK siap rilis di Google Play Console.
              </div>
            </div>
          )}
        </div>

        {/* MODAL FOOTER */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs">
          <span className="text-[11px] text-slate-500">
            Kalkulator RAB Bangun Rumah Pro · PWA & Android Ready
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg text-xs transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
