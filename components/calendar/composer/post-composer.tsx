"use client";

import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from "react";
import { dateKey, emptyPublication, postMediaIds, type Publication } from "@/lib/calendar";
import { AdsTab } from "./ads-tab";
import { BriefTab } from "./brief-tab";
import { CaptionEditor } from "./caption-editor";
import { ComposerFooter, type PrimaryAction } from "./composer-footer";
import { ComposerHeader, type SaveState } from "./composer-header";
import { DayRail } from "./day-rail";
import { MediaLibrarySheet } from "./media-library-sheet";
import { MediaSection } from "./media-section";
import { allowsMany, blockingError, readiness, withMedia, type ComposerTab, type FieldTarget } from "./model";
import { PostPreview, type SocialProfiles } from "./post-preview";
import { ReadinessChecklist } from "./readiness-checklist";
import { ReviewShare, reviewNotice, statusAfterReview } from "./review-share";
import type { PostReview } from "@/lib/post-reviews";
import { ScheduleSection } from "./schedule-section";
import { Segmented, useConfirm } from "./ui";

type Props = {
  server: boolean;
  initial: Publication;
  usedMediaIds: string[];
  posts: Publication[];
  onClose: () => void;
  /** `quiet` saves without the calendar notice or filter reset (autosave). */
  onSave: (post: Publication, options?: { quiet?: boolean }) => Promise<boolean>;
  readOnly?: boolean;
  persistenceError?: string;
  onDelete: (id: string) => Promise<boolean>;
  /** Approval-link decisions known to the calendar (server mode). */
  reviews?: PostReview[];
};

const AUTOSAVE_MS = 1500;
const FIELD_IDS: Record<FieldTarget, string> = { title: "cmp-title", media: "cmp-media", caption: "cmp-caption", networks: "cmp-networks", date: "cmp-date", imageUrl: "cmp-imageUrl", referenceUrl: "cmp-referenceUrl" };

function relative(seconds: number) {
  if (seconds < 5) return "Guardado ahora";
  if (seconds < 60) return `Guardado hace ${seconds} s`;
  return `Guardado hace ${Math.floor(seconds / 60)} min`;
}

/** The trimmed payload the previous editor saved. */
function payload(draft: Publication): Publication {
  return { ...draft, title: draft.title.trim(), referenceUrl: draft.referenceUrl.trim(), imageUrl: draft.imageUrl.trim(), brand: draft.brand.trim() };
}

/** "Composer" for creating and editing a publication: header, day rail, editor tabs, live preview and footer. */
export function PostComposer({ server, usedMediaIds, initial, posts, onClose, onSave, onDelete, readOnly = false, persistenceError = "", reviews = [] }: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [draft, setDraft] = useState(initial);
  const [baseline, setBaseline] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [autosaving, setAutosaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; tone: "error" | "info" } | null>(null);
  const [tab, setTab] = useState<ComposerTab>("post");
  const [view, setView] = useState<"edit" | "preview">("edit");
  const [railOpen, setRailOpen] = useState(true);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [mediaRatio, setMediaRatio] = useState<number | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [autosaveFailed, setAutosaveFailed] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const [companies, setCompanies] = useState<string[]>([]);
  const [companyError, setCompanyError] = useState("");
  const [confirm, confirmElement] = useConfirm();
  // A reviewer's new decision for the open post updates the draft (the calendar skips the post being edited),
  // so autosave persists it instead of writing the old status back.
  const review = reviews.find(item => item.postId === draft.id);
  const pendingDecision = review?.decision && !review.appliedAt ? `${review.postId}:${review.decidedAt}` : "";
  const [seenDecision, setSeenDecision] = useState("");
  if (pendingDecision !== seenDecision) {
    setSeenDecision(pendingDecision);
    if (pendingDecision && review) {
      const status = statusAfterReview(review.decision, draft.status);
      if (status !== draft.status) setDraft(current => ({ ...current, status }));
      setMessage({ text: reviewNotice(review), tone: "info" });
    }
  }
  const today = dateKey(new Date(now));

  useEffect(() => {
    let active = true;
    async function loadCompanies() {
      try {
        let data: unknown;
        if (server) {
          const response = await fetch("/api/companies", { cache: "no-store" });
          if (!response.ok) throw new Error();
          data = await response.json();
        } else data = JSON.parse(localStorage.getItem("focusmrk.companies.v1") || "[]");
        if (!Array.isArray(data) || !data.every(item => typeof item === "string")) throw new Error();
        if (active) setCompanies(data);
      } catch {
        if (active) setCompanyError("No se pudieron cargar todas las empresas. Puedes conservar la actual o volver a abrir el editor para intentarlo de nuevo.");
      }
    }
    void loadCompanies();
    return () => { active = false; };
  }, [server]);
  // Real handle and photo per network for the preview; without them the preview falls back to the company name.
  const [profiles, setProfiles] = useState<{ brand: string; value: SocialProfiles }>({ brand: "", value: {} });
  useEffect(() => {
    const brand = draft.brand.trim();
    if (!server || !brand) return;
    const controller = new AbortController();
    fetch(`/api/social-profiles?company=${encodeURIComponent(brand)}`, { signal: controller.signal, cache: "no-store" })
      .then(response => response.ok ? response.json() : {})
      .then((value: SocialProfiles) => setProfiles({ brand, value }))
      .catch(() => { /* The preview keeps the company name. */ });
    return () => controller.abort();
  }, [server, draft.brand]);
  const companyOptions =Array.from(new Set([...companies, ...posts.map(post => post.brand), draft.brand].filter(Boolean))).sort((a, b) => a.localeCompare(b, "es"));
  const dayPosts = posts.filter(post => post.date === draft.date && post.brand === draft.brand).sort((a, b) => a.time.localeCompare(b.time));
  const dirty = JSON.stringify(draft) !== JSON.stringify(baseline);
  const blocking = blockingError(draft);
  const isBlocked = !!blocking;
  const checks = readiness(draft, mediaRatio, new Date(now));

  // Start on the title, as the previous editor did (showModal alone would focus the brand chip).
  useEffect(() => { dialog.current?.showModal(); document.getElementById("cmp-title")?.focus(); }, []);
  useEffect(() => { const timer = window.setInterval(() => setNow(Date.now()), 5000); return () => window.clearInterval(timer); }, []);
  useEffect(() => {
    if (!dirty) return;
    const prevent = (event: BeforeUnloadEvent) => { event.preventDefault(); };
    window.addEventListener("beforeunload", prevent);
    return () => window.removeEventListener("beforeunload", prevent);
  }, [dirty]);

  // Autosave existing publications 1.5 s after the last change; new ones are only saved explicitly.
  useEffect(() => {
    // One save at a time: the calendar rejects overlapping writes, so wait for the previous one to finish.
    if (!draft.id || !dirty || isBlocked || readOnly || busy || autosaving) return;
    const snapshot = draft;
    const timer = window.setTimeout(async () => {
      setAutosaving(true);
      try {
        if (await onSave(payload(snapshot), { quiet: true })) { setBaseline(snapshot); setSavedAt(Date.now()); setNow(Date.now()); setAutosaveFailed(false); }
        else setAutosaveFailed(true);
      } catch { setAutosaveFailed(true); }
      finally { setAutosaving(false); }
    }, AUTOSAVE_MS);
    return () => window.clearTimeout(timer);
  }, [draft, dirty, isBlocked, readOnly, busy, autosaving, onSave]);

  const patch = useCallback((change: Partial<Publication>) => setDraft(current => ({ ...current, ...change })), []);
  const canLeave = useCallback(async () => !dirty || confirm({ title: "¿Descartar los cambios?", message: "Tienes cambios sin guardar en esta publicación. Si continúas, se perderán.", confirmLabel: "Descartar cambios", danger: true }), [dirty, confirm]);
  async function close() { if (!busy && await canLeave()) onClose(); }
  async function select(post: Publication) {
    if (busy || !await canLeave()) return;
    setDraft(post); setBaseline(post); setMessage(null); setMediaRatio(null); setSavedAt(null); setAutosaveFailed(false);
  }
  function goTo(target: FieldTarget) {
    setView("edit");
    setTab(target === "imageUrl" || target === "referenceUrl" ? "brief" : "post");
    requestAnimationFrame(() => {
      const element = document.getElementById(FIELD_IDS[target]);
      const focusable = target === "networks" ? element?.querySelector<HTMLElement>("button") : element;
      element?.scrollIntoView({ block: "center", behavior: "smooth" });
      focusable?.focus({ preventScroll: true });
    });
  }
  function duplicate(date?: string) {
    setDraft({ ...draft, id: "", status: "Borrador", title: `${draft.title.slice(0, 152)} (copia)`, ...(date ? { date } : {}) });
    setSavedAt(null); setMessage({ text: date ? "Copia creada en borrador. Revisa y guarda." : "Copia creada en borrador. Elige la fecha y guarda.", tone: "info" });
    if (!date) goTo("date");
  }
  async function save(status?: Publication["status"], stay = false) {
    if (busy || readOnly) return;
    const next = status ? { ...draft, status } : draft;
    const problem = blockingError(next);
    if (problem) { setMessage({ text: problem.message, tone: "error" }); goTo(problem.target); return; }
    setBusy(true); setMessage(null);
    try {
      if (await onSave(payload(next))) {
        if (stay) { setDraft(next); setBaseline(next); setSavedAt(Date.now()); setNow(Date.now()); }
        else onClose();
      } else setMessage({ text: "No se pudo guardar. Revisa el aviso del calendario; tus cambios siguen aquí.", tone: "error" });
    } catch { setMessage({ text: "No se pudo guardar. Tus cambios siguen aquí.", tone: "error" }); }
    finally { setBusy(false); }
  }
  function primary(action: PrimaryAction) { void save(action === "publish" ? "Publicado" : action === "schedule" ? "Aprobado" : undefined); }
  async function remove() {
    if (!draft.id || readOnly) return;
    if (!await confirm({ title: "¿Eliminar esta publicación?", message: "Podrás deshacerlo desde el aviso del calendario.", confirmLabel: "Eliminar", danger: true })) return;
    setBusy(true);
    try { if (await onDelete(draft.id)) onClose(); else setMessage({ text: "No se pudo eliminar la publicación. Revisa el aviso del calendario.", tone: "error" }); }
    catch { setMessage({ text: "No se pudo eliminar.", tone: "error" }); }
    finally { setBusy(false); }
  }
  async function copyLink() {
    const url = new URL("/", window.location.origin);
    url.searchParams.set("module", "calendar"); url.searchParams.set("post", draft.id);
    try { await navigator.clipboard.writeText(url.toString()); setMessage({ text: "Enlace copiado.", tone: "info" }); }
    catch { setMessage({ text: `No se pudo copiar. Enlace: ${url}`, tone: "info" }); }
  }
  function shortcuts(event: KeyboardEvent<HTMLDialogElement>) {
    if (!(event.ctrlKey || event.metaKey)) return;
    if (event.key.toLowerCase() === "s") { event.preventDefault(); if (!blocking) void save(undefined, !!draft.id); else if (blocking) goTo(blocking.target); }
    else if (event.key === "Enter") { event.preventDefault(); if (!blocking) primary(draft.status === "Publicado" ? "save" : "schedule"); }
  }

  const saveState: SaveState = autosaving || busy ? { kind: "saving", label: "Guardando…" }
    : autosaveFailed && dirty ? { kind: "error", label: "No se pudo autoguardar" }
    : dirty ? { kind: "dirty", label: "Cambios sin guardar" }
    : !draft.id ? { kind: "new", label: "Sin guardar" }
    : savedAt ? { kind: "saved", label: relative(Math.max(0, Math.round((now - savedAt) / 1000))) }
    : { kind: "saved", label: "Sin cambios" };
  const locked = busy || readOnly;
  const briefHasData = !!(draft.objective || draft.production || draft.imageUrl || draft.referenceUrl || draft.footer);
  const footerMessage = message || (persistenceError ? { text: persistenceError, tone: "error" as const } : null);

  return <dialog ref={dialog} className="cmp-dialog" data-view={view} aria-label={draft.id ? "Editar publicación" : "Nueva publicación"}
    onCancel={event => { event.preventDefault(); void close(); }} onKeyDown={shortcuts}>
    <ComposerHeader draft={draft} companies={companyOptions} companyError={companyError} disabled={busy} readOnly={readOnly} saveState={saveState}
      dayPosts={dayPosts} railOpen={railOpen} onRailOpen={() => setRailOpen(true)}
      onSelectDay={post => void select(post)} onAddDay={() => void select({ ...emptyPublication(draft.date), brand: draft.brand })}
      onChange={patch} onClose={() => void close()} />
    <div className="cmp-mobile-tabs"><Segmented<"edit" | "preview"> label="Vista" value={view} onChange={setView} options={[{ value: "edit", label: "Editar" }, { value: "preview", label: "Vista previa" }]} /></div>
    <div className={`cmp-body${railOpen ? "" : " is-rail-closed"}`}>
      {railOpen && <DayRail date={draft.date} posts={dayPosts} draft={draft} disabled={busy} readOnly={readOnly} onCollapse={() => setRailOpen(false)}
        onSelect={post => void select(post)} onAdd={() => void select({ ...emptyPublication(draft.date), brand: draft.brand })}>
        <ReadinessChecklist items={checks} onGo={goTo} />
      </DayRail>}
      <div className="cmp-center">
        <div className="cmp-tabs">
          <Segmented<ComposerTab> label="Secciones del editor" value={tab} onChange={setTab} options={[
            { value: "post", label: "Publicación" },
            { value: "brief", label: <>Brief creativo{briefHasData && <i className="cmp-dot" aria-label=" (con datos)" />}</> },
            { value: "ads", label: <>Pauta{draft.paid && <i className="cmp-dot" aria-label=" (activa)" />}</> },
          ]} />
        </div>
        <div className="cmp-tab-panel" key={tab}>
          {tab === "post" && <>
            <MediaSection post={draft} disabled={locked} onChange={patch} onOpenLibrary={() => setSheetOpen(true)} onRatio={setMediaRatio} />
            <CaptionEditor post={draft} disabled={locked} onChange={patch} onEditSignature={() => { setTab("brief"); requestAnimationFrame(() => document.getElementById("cmp-footer")?.focus()); }} />
            <ScheduleSection post={draft} disabled={locked} today={today} onChange={patch} onDuplicate={draft.id && !readOnly ? date => duplicate(date) : undefined} />
          </>}
          {tab === "brief" && <BriefTab post={draft} disabled={locked} onChange={patch} />}
          {tab === "ads" && <AdsTab post={draft} disabled={locked} onChange={patch} />}
        </div>
      </div>
      <PostPreview post={draft} disabled={locked} profiles={profiles.brand === draft.brand.trim() ? profiles.value : {}} onAddMedia={() => setSheetOpen(true)} onRatio={setMediaRatio}>
        {/* Shown only when the rail is hidden (collapsed, or below 1280px); see composer.css. */}
        <ReadinessChecklist items={checks} onGo={goTo} id="cmp-checklist-title-preview" className="is-preview-copy" />
      </PostPreview>
    </div>
    <ComposerFooter draft={draft} busy={busy} readOnly={readOnly} blocking={blocking?.message || null} message={footerMessage}
      review={readOnly ? undefined : <ReviewShare draft={draft} server={server} disabled={busy} review={review}
        onShared={() => { if (draft.status === "Borrador") patch({ status: "En revisión" }); }} />}
      onDuplicate={() => duplicate()} onCopyLink={() => void copyLink()} onDelete={() => void remove()} onCancel={() => void close()}
      onSaveDraft={() => void save("Borrador")} onPrimary={primary} />
    {sheetOpen && <MediaLibrarySheet brand={draft.brand} selectedIds={postMediaIds(draft)} usedIds={usedMediaIds} multiple={allowsMany(draft.format)} onClose={() => setSheetOpen(false)}
      onPick={assets => { if (assets[0]?.id !== draft.mediaId) setMediaRatio(null); patch(withMedia(draft, assets.map(asset => asset.id))); setSheetOpen(false); }} />}
    {confirmElement}
  </dialog>;
}
