import { Cross, PawPrint } from 'lucide-react';

type BrandLogoProps = {
  compact?: boolean;
  light?: boolean;
};

export function BrandLogo({ compact = false, light = false }: BrandLogoProps) {
  return (
    <div className={`brand-logo ${compact ? 'brand-logo-compact' : ''} ${light ? 'brand-logo-light' : ''}`}>
      <span className="brand-symbol" aria-hidden="true">
        <PawPrint size={compact ? 21 : 28} />
        <Cross className="brand-cross" size={compact ? 11 : 14} strokeWidth={3} />
      </span>
      <span className="brand-wordmark">
        <strong>PET</strong><b>LIFE</b>
        {!compact && <small>CLÍNICA VETERINÁRIA</small>}
      </span>
    </div>
  );
}
