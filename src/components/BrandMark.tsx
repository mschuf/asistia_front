interface BrandMarkProps {
  size?: "md" | "lg";
}

export default function BrandMark({ size = "md" }: BrandMarkProps) {
  const titleClass = size === "lg" ? "text-4xl" : "text-2xl";

  return (
    <div>
      <p className="text-xs font-black uppercase tracking-[0.24em] text-brand-600">Soporte inteligente</p>
      <h1 className={`${titleClass} font-extrabold tracking-[-0.05em] text-slate-950`}>
        asist<span className="text-brand-600">IA</span>
      </h1>
    </div>
  );
}
