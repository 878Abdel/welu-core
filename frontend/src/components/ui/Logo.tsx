const asset = (f: string) => `${import.meta.env.BASE_URL}${f}`;

/** Marque Wëlu : le W à facettes + le mot « wëlu ». */
export function Logo({ light = false, size = 28, word = true, className = '' }: { light?: boolean; size?: number; word?: boolean; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <img src={asset(light ? 'welu-mark-light.png' : 'welu-mark.png')} alt={word ? '' : 'Wëlu'} style={{ height: size, width: 'auto' }} draggable={false} />
      {word && (
        <span className="font-bold tracking-[-0.03em]" style={{ fontSize: size * 0.72 }}>
          wëlu
        </span>
      )}
    </span>
  );
}
