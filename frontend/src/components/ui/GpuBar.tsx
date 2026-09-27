import { useEffect, useState } from 'react';
import { api, type GpuTelemetry, type Health } from '../../services/api';

/** Télémétrie réelle du cluster : /api/health + /api/gpu-telemetry, rafraîchie toutes les 5 s. */
export function GpuBar({ latency, danger = false }: { latency?: number | null; danger?: boolean }) {
  const [health, setHealth] = useState<Health | null>(null);
  const [gpu, setGpu] = useState<GpuTelemetry | null>(null);
  const [down, setDown] = useState(false);

  useEffect(() => {
    let alive = true;
    const tick = async () => {
      const [h, g] = await Promise.allSettled([api.health(), api.gpuTelemetry()]);
      if (!alive) return;
      if (h.status === 'fulfilled') setHealth(h.value);
      if (g.status === 'fulfilled') setGpu(g.value);
      setDown(h.status === 'rejected' && g.status === 'rejected');
    };
    tick();
    const t = window.setInterval(tick, 5000);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, []);

  const online = !down && health?.status === 'online';
  const item = (label: string, value: React.ReactNode) => (
    <span className="flex items-baseline gap-1.5 whitespace-nowrap">
      <span className={danger ? 'text-white/70' : 'text-white/60'}>{label}</span>
      <b className="font-semibold tabular-nums">{value}</b>
    </span>
  );

  return (
    <div
      className={`no-scrollbar flex h-9 shrink-0 items-center gap-5 overflow-x-auto px-5 text-[11.5px] text-white transition-colors ${
        danger ? 'bg-alert' : 'bg-ink'
      }`}
    >
      <span className="flex items-center gap-2 font-semibold whitespace-nowrap">
        <i className={`size-2 rounded-full ${online ? 'bg-[#76b900] shadow-[0_0_8px_#76b900]' : down ? 'bg-alert' : 'bg-faint'}`} />
        {online ? gpu?.gpu_status ?? 'ONLINE' : down ? 'BACKEND HORS LIGNE' : 'Connexion…'}
      </span>
      {item('GPU', gpu?.gpu_hardware ?? '—')}
      {item('VRAM', gpu ? `${gpu.allocated_vram_mb.toFixed(1)} Mo / ${gpu.total_vram_gb.toFixed(1)} Go` : '—')}
      {item('CUDA', gpu?.cuda_driver_version ?? '—')}
      {item('SM', gpu?.streaming_multiprocessors ?? '—')}
      {item('Latence audit', latency != null ? `${latency.toFixed(2)} ms` : '—')}
      {item('Device', health?.active_device ?? '—')}
      {item('Moteur', health?.engine ?? '—')}
      {item('NIM', health?.nim_multimodal_llm ?? '—')}
      {gpu?.cluster_node && item('Nœud', gpu.cluster_node)}
    </div>
  );
}
