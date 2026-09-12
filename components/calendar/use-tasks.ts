"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { validTask, type Task } from "@/lib/tasks";
const key = "focusmrk.tasks.v1";
function readLocal() {
  const items = JSON.parse(localStorage.getItem(key) || "[]");
  if (!Array.isArray(items) || !items.every(validTask)) throw new Error("No se pudieron leer las tareas guardadas. No se reemplazarán tus datos.");
  return items as Task[];
}
export function useTasks(server: boolean) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const working = useRef(false);
  const generation = useRef(0);
  const reload = useCallback(async () => {
    if (working.current) return;
    const version = ++generation.current;
    try {
      let items;
      if (server) {
        const r = await fetch("/api/tasks", { cache: "no-store" });
        if (!r.ok) throw new Error("No se pudieron cargar las tareas. Revisa tu conexión o inicia sesión de nuevo.");
        items = (await r.json()).tasks;
        if (!Array.isArray(items) || !items.every(validTask)) throw new Error("Datos de tareas inválidos.");
      } else items = readLocal();
      if (version !== generation.current) return;
      setTasks(items); setReady(true); setError("");
    } catch (e) { if (version === generation.current) setError(e instanceof Error ? e.message : "No se pudieron cargar las tareas."); }
  }, [server]);
  useEffect(() => {
    const timer = setTimeout(() => void reload(), 0);
    const refresh = () => { if (!document.hidden) void reload(); };
    window.addEventListener("focus", refresh); window.addEventListener("storage", refresh);
    const interval = setInterval(refresh, 60000);
    // The generation is an async request counter, not a DOM ref; invalidate the latest request on cleanup.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    return () => { clearTimeout(timer); clearInterval(interval); generation.current++; window.removeEventListener("focus", refresh); window.removeEventListener("storage", refresh); };
  }, [reload]);
  async function save(task: Task) {
    if (!ready || working.current || !validTask(task)) return false;
    working.current = true; generation.current++; setBusy(true); setError("");
    try {
      let saved: Task;
      if (server) {
        const r = await fetch("/api/tasks", { method: "PUT", headers: { "Content-Type": "application/json", "x-focusmrk-request": "1" }, body: JSON.stringify(task) });
        const result = await r.json(); if (!r.ok) throw new Error(result.error || "No se pudo guardar.");
        saved = result.task;
      } else {
        const current = readLocal(); const previous = current.find(t => t.id === task.id);
        if ((previous?.version || 0) !== task.version) throw new Error("La tarea cambió en otra pestaña. Recarga antes de editar.");
        saved = { ...task, version: task.version + 1 };
        localStorage.setItem(key, JSON.stringify([...current.filter(t => t.id !== saved.id), saved]));
        setTasks(current);
      }
      setTasks(current => [...current.filter(t => t.id !== saved.id), saved]);
      return true;
    } catch (e) { setError(e instanceof Error ? e.message : "No se pudo guardar la tarea."); return false; }
    finally { working.current = false; setBusy(false); }
  }
  return { tasks, ready, busy, error, reload, save };
}
