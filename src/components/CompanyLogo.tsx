import { useState } from 'react';
import { getLogoCandidates } from '../lib/logo';

interface CompanyLogoProps {
  companyName: string;
  companyUrl?: string | null;
  companyLogoUrl?: string | null;
  size?: 'sm' | 'md';
}

export default function CompanyLogo({ companyName, companyUrl, companyLogoUrl, size = 'md' }: CompanyLogoProps) {
  const candidates = getLogoCandidates(companyUrl, companyLogoUrl);
  const [candidateIndex, setCandidateIndex] = useState(0);

  const sizeClasses = size === 'sm' ? 'h-12 w-12' : 'h-14 w-14';
  const textSize = size === 'sm' ? 'text-lg' : 'text-base';

  const currentUrl = candidates[candidateIndex];

  if (!currentUrl) {
    // No candidates left — show letter fallback
    return (
      <div className={`flex ${sizeClasses} items-center justify-center rounded-xl bg-brand-50 ${textSize} font-bold text-brand-500`}>
        {companyName.charAt(0).toUpperCase()}
      </div>
    );
  }

  return (
    <>
      <img
        src={currentUrl}
        alt={`${companyName} logo`}
        loading="lazy"
        className={`${sizeClasses} rounded-xl object-contain bg-gray-100 p-1.5`}
        onError={() => {
          // Try next candidate
          setCandidateIndex((i) => i + 1);
        }}
      />
      {/* Hidden fallback in case all images fail — shown when img has display:none wouldn't work with state approach */}
    </>
  );
}
