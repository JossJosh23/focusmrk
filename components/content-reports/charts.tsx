"use client";
export const formatNumber = (value: number | null | undefined, suffix = "") => typeof value === "number" && Number.isFinite(value) ? value.toLocaleString("es-EC", { maximumFractionDigits: 2 }) + suffix : "No disponible";
export function Bars({ rows, percent = false }: { rows: { label: string; value: number | null }[]; percent?: boolean }) {
  const max = percent ? 100 : Math.max(1, ...rows.map(r => r.value || 0));
  return rows.length ? <div className="ci-bars">{rows.map((r,i) => <div key={`${r.label}-${i}`}><span>{r.label}</span><div className="ci-track"><span style={{ width: `${Math.max(0,Math.min(100,(r.value || 0)/max*100))}%` }} /></div><strong>{formatNumber(r.value,percent ? "%" : "")}</strong></div>)}</div> : <p className="ci-empty">No disponible</p>;
}
export function LineChart({ series, labels }: { series: { name: string; values: (number | null)[] }[]; labels: string[] }) {
  const max = Math.max(1, ...series.flatMap(s => s.values.map(v => v || 0)));
  const hasData = series.some(s => s.values.some(v => v !== null));
  if (!hasData) return <p className="ci-empty">No disponible para la métrica y las redes seleccionadas.</p>;
  const x = (i: number) => 60 + i / Math.max(1,labels.length-1)*720, y = (v: number) => 215 - v/max*175;
  return <div className="ci-chart"><svg viewBox="0 0 810 265" role="img" aria-label={`Gráfica de ${series.map(s => s.name).join(", ")}`}>
    {[0,.5,1].map(t => <g key={t}><line x1="60" x2="780" y1={y(max*t)} y2={y(max*t)} className="ci-grid-line" /><text x="50" y={y(max*t)+4} textAnchor="end">{formatNumber(max*t)}</text></g>)}
    {series.map((s,n) => <g key={s.name} className={`ci-line-${n % 3}`}>{s.values.map((v,i) => v === null ? null : <g key={i}>{i > 0 && s.values[i-1] !== null && <line x1={x(i-1)} y1={y(s.values[i-1]!)} x2={x(i)} y2={y(v)} />}<circle cx={x(i)} cy={y(v)} r="3"><title>{`${s.name} · ${labels[i]}: ${formatNumber(v)}`}</title></circle></g>)}</g>)}
    {[0,Math.floor((labels.length-1)/2),labels.length-1].filter((v,i,a)=>a.indexOf(v)===i).map(i => <text key={i} x={x(i)} y="247" textAnchor="middle">{labels[i]?.match(/^\d{4}-/)?labels[i].slice(5):labels[i]}</text>)}
  </svg><div className="ci-legend">{series.map((s,n) => <span key={s.name} className={`ci-line-${n%3}`}><i />{s.name}</span>)}</div><details><summary>Ver datos de la gráfica</summary><div className="ci-table-scroll"><table><thead><tr><th>Fecha</th>{series.map(s=><th key={s.name}>{s.name}</th>)}</tr></thead><tbody>{labels.map((label,i)=><tr key={label}><td>{label}</td>{series.map(s=><td key={s.name}>{formatNumber(s.values[i])}</td>)}</tr>)}</tbody></table></div></details></div>;
}
export function Heatmap({ rows }: { rows: { day: number; hour: number; value: number }[] }) {
  const days = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"], max = Math.max(1,...rows.map(r=>r.value));
  if (!rows.length) return <p className="ci-empty">No disponible. Aún no hay datos de actividad de audiencia.</p>;
  return <div className="ci-table-scroll"><div className="ci-heatmap"><span />{Array.from({length:24},(_,hour)=><small key={hour}>{hour}</small>)}{days.map((day,n)=><div className="ci-heat-row" key={day}><small>{day}</small>{Array.from({length:24},(_,hour)=>{const value=rows.find(r=>r.day===n&&r.hour===hour)?.value;return <span key={hour} title={`${day} ${hour}:00 · ${formatNumber(value)}`} style={{opacity:value===undefined?.1:.15+value/max*.85}}/>;})}</div>)}</div><p>Horas de Ecuador · Intensidad relativa de actividad.</p></div>;
}
