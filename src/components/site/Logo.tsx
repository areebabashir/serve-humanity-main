import logoAsset from "@/assets/logo.png";
import { Link } from "react-router-dom";

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <Link to="/" className="group flex items-center gap-2.5">
      <div className="relative -my-2 flex h-14 w-[72px] shrink-0 items-center justify-center overflow-visible rounded-full transition-transform duration-500 group-hover:rotate-[8deg]">
        <div className="absolute inset-0 rounded-full bg-gradient-warm opacity-0 blur-xl transition-opacity duration-500 group-hover:opacity-60" />
        <img
          src={logoAsset}
          alt="Serve Humanity"
          className="relative h-[72px] w-[72px] object-contain drop-shadow-sm"
          loading="eager"
          width={72}
          height={72}
        />
      </div>
      {!compact && (
        <div className="hidden sm:flex flex-col leading-none">
          <span className="font-display text-[15px] font-bold tracking-tight text-foreground">
            Serve Humanity
          </span>
          <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
            خدمتِ انسانیت
          </span>
        </div>
      )}
    </Link>
  );
}
