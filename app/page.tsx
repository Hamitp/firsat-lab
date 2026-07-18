"use client";

import { ChangeEvent, FormEvent, useEffect, useMemo, useRef, useState } from "react";

type Status = "Yeni" | "Değerlendiriliyor" | "Öncelikli" | "Geliştiriliyor";
type Category = "Belge & Rapor" | "Hesap & Kontrol" | "Veri Aktarımı" | "Koordinasyon" | "Diğer";

type Opportunity = {
  id: string;
  title: string;
  task: string;
  pain: string;
  idea: string;
  category: Category;
  status: Status;
  frequency: number;
  timeLoss: number;
  errorRisk: number;
  ruleFit: number;
  reuse: number;
  minutes: number;
  createdAt: string;
  updatedAt: string;
};

const STORAGE_KEY = "firsat-lab-opportunities-v1";
const statuses: Status[] = ["Yeni", "Değerlendiriliyor", "Öncelikli", "Geliştiriliyor"];
const categories: Category[] = ["Belge & Rapor", "Hesap & Kontrol", "Veri Aktarımı", "Koordinasyon", "Diğer"];

const starterItems: Opportunity[] = [
  {
    id: "sample-1",
    title: "Teknik şartname tutarlılık kontrolü",
    task: "Farklı disiplinlere ait şartname maddelerini tek tek karşılaştırıyorum.",
    pain: "Tekrarlı hükümleri ve çelişkileri gözden kaçırma riski var.",
    idea: "Word ve PDF dosyalarını tarayıp benzer, çelişkili ve eksik maddeleri işaretleyen bir kontrol aracı.",
    category: "Belge & Rapor",
    status: "Öncelikli",
    frequency: 4,
    timeLoss: 5,
    errorRisk: 4,
    ruleFit: 4,
    reuse: 5,
    minutes: 180,
    createdAt: "2026-07-16T09:20:00.000Z",
    updatedAt: "2026-07-17T15:10:00.000Z",
  },
  {
    id: "sample-2",
    title: "Raporlardan tabloya veri toplama",
    task: "Fizibilite raporlarından aynı başlıkları bulup Excel tablosuna aktarıyorum.",
    pain: "Kopyala-yapıştır uzun sürüyor; kaynak ve birim hataları oluşabiliyor.",
    idea: "Belgeyi okuyup seçili alanları kaynak sayfasıyla birlikte tabloya çıkaran yardımcı.",
    category: "Veri Aktarımı",
    status: "Değerlendiriliyor",
    frequency: 5,
    timeLoss: 4,
    errorRisk: 4,
    ruleFit: 5,
    reuse: 4,
    minutes: 120,
    createdAt: "2026-07-15T12:00:00.000Z",
    updatedAt: "2026-07-16T11:40:00.000Z",
  },
  {
    id: "sample-3",
    title: "Haftalık proje durum özeti",
    task: "Toplantı notları ve iş listelerinden haftalık ilerleme özeti hazırlıyorum.",
    pain: "Bilgi farklı yerlerde; aynı rapor düzenini her hafta yeniden kuruyorum.",
    idea: "Notları birleştirip risk, karar ve aksiyon başlıklarında taslak rapor oluşturan akış.",
    category: "Koordinasyon",
    status: "Yeni",
    frequency: 5,
    timeLoss: 3,
    errorRisk: 3,
    ruleFit: 4,
    reuse: 5,
    minutes: 75,
    createdAt: "2026-07-17T08:10:00.000Z",
    updatedAt: "2026-07-17T08:10:00.000Z",
  },
];

const blankDraft = {
  title: "",
  task: "",
  pain: "",
  idea: "",
  category: "Belge & Rapor" as Category,
  frequency: 3,
  minutes: 30,
};

function score(item: Opportunity) {
  return item.frequency + item.timeLoss + item.errorRisk + item.ruleFit + item.reuse;
}

function scoreLabel(value: number) {
  if (value >= 21) return "Çok yüksek";
  if (value >= 16) return "Yüksek";
  if (value >= 11) return "Orta";
  return "Keşfedilecek";
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "short" }).format(new Date(value));
}

function escapeCsv(value: string | number) {
  return `"${String(value).replaceAll('"', '""')}"`;
}

function downloadFile(name: string, content: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = name;
  anchor.click();
  URL.revokeObjectURL(url);
}

function Metric({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  return (
    <div className="metric-control">
      <div className="metric-label"><span>{label}</span><strong>{value}/5</strong></div>
      <div className="metric-dots" role="group" aria-label={label}>
        {[1, 2, 3, 4, 5].map((dot) => (
          <button key={dot} type="button" className={dot <= value ? "active" : ""} onClick={() => onChange(dot)} aria-label={`${label}: ${dot}`} />
        ))}
      </div>
    </div>
  );
}

export default function Home() {
  const [items, setItems] = useState<Opportunity[]>(starterItems);
  const [hydrated, setHydrated] = useState(false);
  const [captureOpen, setCaptureOpen] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [exportOpen, setExportOpen] = useState(false);
  const [draft, setDraft] = useState(blankDraft);
  const [step, setStep] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<Status | "Tümü">("Tümü");
  const [categoryFilter, setCategoryFilter] = useState<Category | "Tümü">("Tümü");
  const [sortBy, setSortBy] = useState<"score" | "recent">("score");
  const [toast, setToast] = useState("");
  const [mobileNav, setMobileNav] = useState(false);
  const importRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    queueMicrotask(() => {
      if (stored) {
        try { setItems(JSON.parse(stored)); } catch { /* Keep examples if backup is malformed. */ }
      }
      setHydrated(true);
    });
  }, []);

  useEffect(() => {
    if (hydrated) localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items, hydrated]);

  useEffect(() => {
    const close = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setCaptureOpen(false);
        setDetailId(null);
        setExportOpen(false);
      }
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setCaptureOpen(true);
      }
    };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 2600);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const filtered = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("tr-TR");
    return items
      .filter((item) => statusFilter === "Tümü" || item.status === statusFilter)
      .filter((item) => categoryFilter === "Tümü" || item.category === categoryFilter)
      .filter((item) => !query || [item.title, item.task, item.pain, item.idea].join(" ").toLocaleLowerCase("tr-TR").includes(query))
      .sort((a, b) => sortBy === "score" ? score(b) - score(a) : +new Date(b.updatedAt) - +new Date(a.updatedAt));
  }, [items, search, statusFilter, categoryFilter, sortBy]);

  const totalMinutes = items.reduce((sum, item) => sum + item.minutes * item.frequency, 0);
  const highPotential = items.filter((item) => score(item) >= 21).length;
  const average = items.length ? Math.round(items.reduce((sum, item) => sum + score(item), 0) / items.length) : 0;
  const latestTimestamp = Math.max(0, ...items.map((item) => +new Date(item.createdAt)));
  const weeklyCount = items.filter((item) => latestTimestamp - +new Date(item.createdAt) < 7 * 86400000).length;
  const selected = items.find((item) => item.id === detailId) ?? null;

  function resetCapture() {
    setDraft(blankDraft);
    setStep(1);
  }

  function saveCapture(event: FormEvent) {
    event.preventDefault();
    if (!draft.title.trim() || !draft.pain.trim()) return;
    const now = new Date().toISOString();
    const newItem: Opportunity = {
      id: crypto.randomUUID(),
      title: draft.title.trim(),
      task: draft.task.trim(),
      pain: draft.pain.trim(),
      idea: draft.idea.trim(),
      category: draft.category,
      status: "Yeni",
      frequency: draft.frequency,
      minutes: draft.minutes,
      timeLoss: Math.min(5, Math.max(1, Math.ceil(draft.minutes / 30))),
      errorRisk: 3,
      ruleFit: 3,
      reuse: 3,
      createdAt: now,
      updatedAt: now,
    };
    setItems((current) => [newItem, ...current]);
    setCaptureOpen(false);
    resetCapture();
    setToast("Fırsat havuza eklendi");
  }

  function updateItem(id: string, changes: Partial<Opportunity>) {
    setItems((current) => current.map((item) => item.id === id ? { ...item, ...changes, updatedAt: new Date().toISOString() } : item));
  }

  function deleteItem(id: string) {
    setItems((current) => current.filter((item) => item.id !== id));
    setDetailId(null);
    setToast("Fırsat silindi");
  }

  function exportJson() {
    downloadFile(`firsat-lab-yedek-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify({ version: 1, exportedAt: new Date().toISOString(), opportunities: items }, null, 2), "application/json");
    setToast("JSON yedeği hazır");
  }

  function exportCsv() {
    const headers = ["Başlık", "Kategori", "Durum", "Yapılan iş", "Sorun", "Otomasyon fikri", "Tekrar", "Zaman kaybı", "Hata riski", "Kurala uygunluk", "Yeniden kullanım", "Toplam puan", "Dakika"];
    const rows = items.map((item) => [item.title, item.category, item.status, item.task, item.pain, item.idea, item.frequency, item.timeLoss, item.errorRisk, item.ruleFit, item.reuse, score(item), item.minutes]);
    downloadFile(`firsat-lab-${new Date().toISOString().slice(0, 10)}.csv`, "\ufeff" + [headers, ...rows].map((row) => row.map(escapeCsv).join(";")).join("\n"), "text/csv;charset=utf-8");
    setToast("CSV dosyası hazır");
  }

  function exportMarkdown() {
    const content = [`# Fırsat Lab — Otomasyon Fırsatları`, ``, `> ${new Date().toLocaleDateString("tr-TR")} tarihinde dışa aktarıldı. ${items.length} fırsat içerir.`, ``,
      ...items.flatMap((item) => [`## ${item.title}`, ``, `**Durum:** ${item.status}  `, `**Kategori:** ${item.category}  `, `**Fırsat puanı:** ${score(item)}/25 — ${scoreLabel(score(item))}`, ``, `### Mevcut iş`, item.task || "—", ``, `### Sorun`, item.pain || "—", ``, `### Otomasyon düşüncesi`, item.idea || "—", ``, `### Puanlama`, `- Tekrar sıklığı: ${item.frequency}/5`, `- Zaman kaybı: ${item.timeLoss}/5`, `- Hata riski: ${item.errorRisk}/5`, `- Kurala bağlanabilirlik: ${item.ruleFit}/5`, `- Yeniden kullanım: ${item.reuse}/5`, ``, `---`, ``])].join("\n");
    downloadFile(`firsat-lab-${new Date().toISOString().slice(0, 10)}.md`, content, "text/markdown;charset=utf-8");
    setToast("Markdown raporu hazır");
  }

  function importJson(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        const incoming = Array.isArray(parsed) ? parsed : parsed.opportunities;
        if (!Array.isArray(incoming)) throw new Error("invalid");
        if (items.length > 0 && !window.confirm(`Mevcut ${items.length} kayıt, yedekteki ${incoming.length} kayıtla değiştirilecek. Devam etmek istiyor musunuz?`)) {
          event.target.value = "";
          return;
        }
        setItems(incoming);
        setToast(`${incoming.length} fırsat geri yüklendi`);
        setExportOpen(false);
      } catch {
        setToast("Bu dosya geçerli bir Fırsat Lab yedeği değil");
      }
      event.target.value = "";
    };
    reader.readAsText(file);
  }

  return (
    <main className="app-shell">
      <div className="ambient ambient-one" /><div className="ambient ambient-two" />
      <aside className={`sidebar ${mobileNav ? "open" : ""}`}>
        <a className="brand" href="#top" aria-label="Fırsat Lab ana sayfa"><span className="brand-mark">F</span><span>Fırsat<strong>Lab</strong></span></a>
        <nav aria-label="Ana menü">
          <a className="nav-item active" href="#top"><span>⌂</span> Genel bakış</a>
          <a className="nav-item" href="#pool"><span>◇</span> Fırsat havuzu <b>{items.length}</b></a>
          <button className="nav-item" onClick={() => importRef.current?.click()}><span>↥</span> İçe aktar</button>
          <button className="nav-item" onClick={() => setExportOpen(true)}><span>↗</span> Dışa aktar</button>
        </nav>
        <div className="sidebar-note">
          <span className="pulse-dot" />
          <p><strong>Verilerin güvende</strong>Bu cihazda, tarayıcında saklanıyor.</p>
        </div>
        <div className="profile"><div className="avatar">HP</div><div><strong>Çalışma alanım</strong><span>Kişisel keşif panosu</span></div></div>
      </aside>

      <section className="content" id="top">
        <header className="topbar">
          <button className="icon-button menu-button" onClick={() => setMobileNav((open) => !open)} aria-label="Menüyü aç">☰</button>
          <div className="breadcrumbs"><span>Çalışma alanım</span><b>/</b><strong>Genel bakış</strong></div>
          <div className="top-actions"><span className="shortcut">⌘ K</span><button className="ghost-button" onClick={() => importRef.current?.click()}>İçe aktar <span>↥</span></button><button className="ghost-button" onClick={() => setExportOpen(true)}>Dışa aktar <span>↗</span></button><button className="primary-button compact" onClick={() => setCaptureOpen(true)}><span>＋</span> Fırsat yakala</button></div>
        </header>

        <div className="page-wrap">
          <section className="hero">
            <div>
              <div className="eyebrow"><span /> SÜREÇ RADARIN AÇIK</div>
              <h1>Bugün neyi daha<br /><em>akıllı</em> hale getirebiliriz?</h1>
              <p>İşin akışını bozmadan sürtünme noktalarını yakala. En değerli olanları puanla, net bir yazılım fikrine dönüştür.</p>
              <div className="hero-actions"><button className="primary-button hero-cta" onClick={() => setCaptureOpen(true)}><span className="spark">✦</span> Yeni fırsat yakala <small>30 sn</small></button><button className="text-button" onClick={() => document.querySelector("#pool")?.scrollIntoView({ behavior: "smooth" })}>Havuzu incele <span>↓</span></button></div>
            </div>
            <div className="radar-card" aria-label="Fırsat radarı özeti">
              <div className="radar-orbit orbit-one" /><div className="radar-orbit orbit-two" /><div className="radar-orbit orbit-three" />
              <div className="radar-beam" />
              <div className="radar-center"><strong>{average}</strong><span>ortalama<br />potansiyel</span></div>
              <i className="signal signal-a" /><i className="signal signal-b" /><i className="signal signal-c" />
              <div className="radar-caption"><span>CANLI GÖRÜNÜM</span><b>{highPotential} yüksek potansiyel</b></div>
            </div>
          </section>

          <section className="stats-grid" aria-label="Özet metrikler">
            <article className="stat-card"><div className="stat-icon cyan">◇</div><div><span>TOPLAM FIRSAT</span><strong>{items.length}</strong><small><b>+{weeklyCount}</b> bu hafta yakalandı</small></div><div className="mini-bars">{[38, 52, 42, 68, 54, 88, 76].map((h, i) => <i key={i} style={{ height: `${h}%` }} />)}</div></article>
            <article className="stat-card"><div className="stat-icon violet">✦</div><div><span>YÜKSEK POTANSİYEL</span><strong>{highPotential}</strong><small>Harekete geçmeye hazır</small></div><div className="ring" style={{ "--value": `${Math.max(8, items.length ? Math.round(highPotential / items.length * 100) : 0)}%` } as React.CSSProperties}><span>{items.length ? Math.round(highPotential / items.length * 100) : 0}%</span></div></article>
            <article className="stat-card"><div className="stat-icon mint">↗</div><div><span>TAHMİNİ KAZANÇ</span><strong>{Math.round(totalMinutes / 60)}<sup>sa</sup></strong><small>Her tekrar döngüsünde</small></div><div className="trend">↗ <span>zaman cebinde</span></div></article>
          </section>

          <section className="pool-section" id="pool">
            <div className="section-heading"><div><span className="eyebrow simple">FIRSAT HAVUZU</span><h2>Yakalanan sinyaller</h2><p>En güçlü fırsatlar otomatik olarak yukarı taşınır.</p></div><button className="secondary-button" onClick={() => setCaptureOpen(true)}>＋ Yeni kayıt</button></div>
            <div className="filterbar">
              <label className="searchbox"><span>⌕</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Fırsatlarda ara…" /></label>
              <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as Status | "Tümü")} aria-label="Duruma göre filtrele"><option>Tümü</option>{statuses.map((status) => <option key={status}>{status}</option>)}</select>
              <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value as Category | "Tümü")} aria-label="Kategoriye göre filtrele"><option>Tümü</option>{categories.map((category) => <option key={category}>{category}</option>)}</select>
              <div className="sort-toggle"><button className={sortBy === "score" ? "active" : ""} onClick={() => setSortBy("score")}>Potansiyel</button><button className={sortBy === "recent" ? "active" : ""} onClick={() => setSortBy("recent")}>En yeni</button></div>
            </div>

            {filtered.length ? <div className="opportunity-grid">
              {filtered.map((item, index) => {
                const value = score(item);
                return <article className="opportunity-card" key={item.id} style={{ animationDelay: `${index * 55}ms` }} onClick={() => setDetailId(item.id)} tabIndex={0} onKeyDown={(event) => event.key === "Enter" && setDetailId(item.id)}>
                  <div className="card-top"><span className={`status status-${item.status.toLocaleLowerCase("tr-TR").replaceAll("ı", "i").replaceAll("ş", "s").replaceAll("ğ", "g").replaceAll("ü", "u").replaceAll("ö", "o").replaceAll("ç", "c")}`}><i />{item.status}</span><button className="more" aria-label={`${item.title} ayrıntıları`}>•••</button></div>
                  <div className="category-icon">{item.category === "Belge & Rapor" ? "▤" : item.category === "Veri Aktarımı" ? "⇄" : item.category === "Hesap & Kontrol" ? "∑" : item.category === "Koordinasyon" ? "◎" : "◇"}</div>
                  <h3>{item.title}</h3><p>{item.pain}</p>
                  <div className="scoreline"><div><span>FIRSAT PUANI</span><strong>{value}<small>/25</small></strong></div><div className="scorebar"><i style={{ width: `${value * 4}%` }} /></div><b>{scoreLabel(value)}</b></div>
                  <footer><span>{item.category}</span><time>{formatDate(item.updatedAt)}</time></footer>
                </article>;
              })}
              <button className="add-card" onClick={() => setCaptureOpen(true)}><span>＋</span><strong>Yeni bir sinyal yakala</strong><small>Aklından kaçmadan kaydet</small></button>
            </div> : <div className="empty-state"><span>⌁</span><h3>Bu filtrelerde sinyal yok</h3><p>Aramayı sadeleştir veya yeni bir fırsat yakala.</p><button className="primary-button" onClick={() => setCaptureOpen(true)}>Fırsat yakala</button></div>}
          </section>

          <footer className="page-footer"><span>Fırsat Lab · Yerel MVP</span><span>Veriler yalnızca bu tarayıcıda saklanır</span></footer>
        </div>
      </section>

      {captureOpen && <div className="overlay" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && setCaptureOpen(false)}>
        <form className="capture-modal" onSubmit={saveCapture} role="dialog" aria-modal="true" aria-labelledby="capture-title">
          <div className="modal-head"><div><span className="modal-kicker">HIZLI YAKALAMA · {step}/3</span><h2 id="capture-title">{step === 1 ? "Şu anda ne yapıyorsun?" : step === 2 ? "Sürtünme nerede?" : "Aklındaki kıvılcım ne?"}</h2></div><button type="button" className="close-button" onClick={() => setCaptureOpen(false)}>×</button></div>
          <div className="progress"><i style={{ width: `${step / 3 * 100}%` }} /></div>
          {step === 1 && <div className="step-panel">
            <label>Bu fırsata kısa bir ad ver<input autoFocus value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} placeholder="Örn. Raporlardan veri toplama" maxLength={80} /></label>
            <label>Yaptığın işi tek cümleyle anlat<textarea value={draft.task} onChange={(event) => setDraft({ ...draft, task: event.target.value })} placeholder="Her ay farklı raporlardan aynı bilgileri bulup tabloya aktarıyorum…" rows={3} /></label>
            <label>Kategori<select value={draft.category} onChange={(event) => setDraft({ ...draft, category: event.target.value as Category })}>{categories.map((category) => <option key={category}>{category}</option>)}</select></label>
          </div>}
          {step === 2 && <div className="step-panel">
            <label>En yorucu, yavaş veya riskli kısmı ne?<textarea autoFocus value={draft.pain} onChange={(event) => setDraft({ ...draft, pain: event.target.value })} placeholder="Elle kontrol etmek uzun sürüyor ve satır atlayabiliyorum…" rows={4} /></label>
            <div className="two-fields"><label>Ne kadar sık?<select value={draft.frequency} onChange={(event) => setDraft({ ...draft, frequency: Number(event.target.value) })}><option value="1">Nadiren</option><option value="2">Ayda birkaç</option><option value="3">Haftalık</option><option value="4">Haftada birkaç</option><option value="5">Her gün</option></select></label><label>Bir seferde kaç dakika?<input type="number" min="5" max="1440" step="5" value={draft.minutes} onChange={(event) => setDraft({ ...draft, minutes: Number(event.target.value) })} /></label></div>
          </div>}
          {step === 3 && <div className="step-panel">
            <label>Bilgisayar bunun hangi kısmını üstlenebilir?<textarea autoFocus value={draft.idea} onChange={(event) => setDraft({ ...draft, idea: event.target.value })} placeholder="Belgeleri okuyup seçtiğim başlıkları kaynaklarıyla tabloya çıkarsa…" rows={5} /></label>
            <div className="capture-summary"><span>✦</span><p><strong>Detayları sonra tamamlayabilirsin.</strong>Şimdilik sinyali kaybetmemek yeterli.</p></div>
          </div>}
          <div className="modal-actions"><button type="button" className="text-button" onClick={() => step === 1 ? setCaptureOpen(false) : setStep(step - 1)}>{step === 1 ? "Vazgeç" : "← Geri"}</button>{step < 3 ? <button type="button" className="primary-button" disabled={(step === 1 && !draft.title.trim()) || (step === 2 && !draft.pain.trim())} onClick={() => setStep(step + 1)}>Devam et →</button> : <button className="primary-button" disabled={!draft.title.trim() || !draft.pain.trim()}><span>✦</span> Havuzuna ekle</button>}</div>
        </form>
      </div>}

      {selected && <div className="overlay drawer-overlay" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && setDetailId(null)}>
        <aside className="detail-drawer" role="dialog" aria-modal="true" aria-labelledby="detail-title">
          <div className="drawer-head"><div><span className="modal-kicker">FIRSAT DETAYI</span><h2 id="detail-title">{selected.title}</h2></div><button className="close-button" onClick={() => setDetailId(null)}>×</button></div>
          <div className="detail-score"><div className="score-bubble"><strong>{score(selected)}</strong><span>/25</span></div><div><span>OTOMASYON POTANSİYELİ</span><h3>{scoreLabel(score(selected))}</h3><div className="scorebar large"><i style={{ width: `${score(selected) * 4}%` }} /></div></div></div>
          <div className="detail-fields">
            <label>Durum<select value={selected.status} onChange={(event) => updateItem(selected.id, { status: event.target.value as Status })}>{statuses.map((status) => <option key={status}>{status}</option>)}</select></label>
            <label>Kategori<select value={selected.category} onChange={(event) => updateItem(selected.id, { category: event.target.value as Category })}>{categories.map((category) => <option key={category}>{category}</option>)}</select></label>
          </div>
          <section className="detail-copy"><span>MEVCUT İŞ</span><textarea value={selected.task} onChange={(event) => updateItem(selected.id, { task: event.target.value })} rows={3} /></section>
          <section className="detail-copy"><span>SÜRTÜNME NOKTASI</span><textarea value={selected.pain} onChange={(event) => updateItem(selected.id, { pain: event.target.value })} rows={3} /></section>
          <section className="detail-copy idea-copy"><span>OTOMASYON DÜŞÜNCESİ</span><textarea value={selected.idea} onChange={(event) => updateItem(selected.id, { idea: event.target.value })} rows={4} placeholder="Bu işi kolaylaştıracak fikrini yaz…" /></section>
          <section className="metrics-panel"><div className="panel-title"><span>HIZLI PUANLAMA</span><small>Her ölçütü 1–5 arası değerlendir</small></div>
            <Metric label="Tekrar sıklığı" value={selected.frequency} onChange={(value) => updateItem(selected.id, { frequency: value })} />
            <Metric label="Zaman kaybı" value={selected.timeLoss} onChange={(value) => updateItem(selected.id, { timeLoss: value })} />
            <Metric label="Hata riski" value={selected.errorRisk} onChange={(value) => updateItem(selected.id, { errorRisk: value })} />
            <Metric label="Kurala bağlanabilirlik" value={selected.ruleFit} onChange={(value) => updateItem(selected.id, { ruleFit: value })} />
            <Metric label="Yeniden kullanım" value={selected.reuse} onChange={(value) => updateItem(selected.id, { reuse: value })} />
          </section>
          <div className="drawer-actions"><button className="danger-button" onClick={() => deleteItem(selected.id)}>Sil</button><button className="primary-button" onClick={() => { setDetailId(null); setToast("Değişiklikler kaydedildi"); }}>Tamamlandı</button></div>
        </aside>
      </div>}

      {exportOpen && <div className="overlay" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && setExportOpen(false)}>
        <section className="export-modal" role="dialog" aria-modal="true" aria-labelledby="export-title"><div className="modal-head"><div><span className="modal-kicker">VERİLERİN SENİN</span><h2 id="export-title">Dışa aktar ve yedekle</h2><p>{items.length} fırsat, tek tıkla taşınmaya hazır.</p></div><button className="close-button" onClick={() => setExportOpen(false)}>×</button></div>
          <div className="export-grid"><button onClick={exportJson}><span className="export-icon json">{"{}"}</span><strong>JSON yedeği</strong><small>Tüm verileri eksiksiz sakla ve geri yükle.</small><b>İndir ↗</b></button><button onClick={exportCsv}><span className="export-icon csv">▦</span><strong>CSV tablosu</strong><small>Excel’de filtrele, sırala ve paylaş.</small><b>İndir ↗</b></button><button onClick={exportMarkdown}><span className="export-icon md">M↓</span><strong>Markdown raporu</strong><small>Obsidian veya notlarında kullan.</small><b>İndir ↗</b></button></div>
          <div className="restore-row"><div><span>↺</span><p><strong>Yedeği geri yükle</strong><small>Daha önce indirdiğin JSON dosyasını seç.</small></p></div><button className="secondary-button" onClick={() => importRef.current?.click()}>JSON içe aktar</button></div>
        </section>
      </div>}

      <input ref={importRef} type="file" accept=".json,application/json" hidden onChange={importJson} />
      {toast && <div className="toast"><span>✓</span>{toast}</div>}
    </main>
  );
}
