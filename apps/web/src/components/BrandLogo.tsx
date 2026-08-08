import { Cross, PawPrint } from 'lucide-react';

type BrandLogoProps = {
  compact?: boolean;
  light?: boolean;
  name?: string;
  logoDataUrl?: string | null;
};

export function BrandLogo({ compact = false, light = false, name = 'PetLife', logoDataUrl }: BrandLogoProps) {
  const normalized = name.trim() || 'PetLife';

  return (
    <div className={`brand-logo ${compact ? 'brand-logo-compact' : ''} ${light ? 'brand-logo-light' : ''}`}>
      {logoDataUrl ? (
        <span className="brand-uploaded-logo"><img src={logoDataUrl} alt={`Logo ${normalized}`} /></span>
      ) : (
        <span className="brand-symbol" aria-hidden="true">
          <PawPrint size={compact ? 21 : 28} />
          <Cross className="brand-cross" size={compact ? 11 : 14} strokeWidth={3} />
        </span>
      )}
      <span className="brand-wordmark">
        <span className="brand-name-line">
          <strong>PETLIFE</strong>
        </span>
        {!compact && <small>CLÍNICA VETERINÁRIA</small>}
      </span>
    </div>
  );
}
