import React from 'react';
import { Radio, ExternalLink } from 'lucide-react';

export function WhatsAppIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg 
      viewBox="0 0 24 24" 
      fill="currentColor" 
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.513 2.262 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.458L0 24zm6.59-4.846c1.6.95 3.182 1.449 4.825 1.451 5.436 0 9.86-4.37 9.864-9.799.002-2.63-1.023-5.101-2.885-6.97C16.638 1.971 14.161.947 11.517.947c-5.44 0-9.866 4.372-9.87 9.802 0 1.672.43 3.302 1.247 4.75L1.874 20.2l4.773-1.046zM18.006 14.75c-.328-.164-1.942-.958-2.242-1.068-.3-.11-.518-.164-.737.164-.219.328-.847 1.068-1.039 1.287-.192.219-.383.246-.711.082-.328-.164-1.385-.51-2.637-1.627-.975-.87-1.633-1.946-1.824-2.274-.192-.328-.02-.505.143-.668.146-.146.328-.383.492-.575.164-.192.219-.328.328-.548.11-.219.055-.411-.027-.575-.082-.164-.737-1.779-1.01-2.436-.266-.641-.532-.553-.73-.563-.189-.01-.406-.01-.622-.01-.216 0-.568.082-.865.411-.297.328-1.137 1.11-1.137 2.709 0 1.599 1.164 3.142 1.326 3.36.162.219 2.292 3.5 5.552 4.908.775.335 1.38.535 1.852.686.779.248 1.488.213 2.048.13.624-.092 1.942-.795 2.216-1.56.274-.767.274-1.423.192-1.56-.082-.137-.3-.219-.628-.383z"/>
    </svg>
  );
}

export const LAC_ANALYZER_URL = "https://www.laccelldecoder.com/";
export const WHATSAPP_NUMBER = "+8801752008041";
export const WHATSAPP_URL = "https://wa.me/8801752008041";

/**
 * Eye-catching LAC Cell Analyzer button
 */
export function LacCellAnalyzerButton({ compact = false }: { compact?: boolean }) {
  return (
    <a
      href={LAC_ANALYZER_URL}
      target="_blank"
      rel="noopener noreferrer"
      className="relative group flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500/15 via-[#3ecf8e]/20 to-teal-500/15 border border-[#3ecf8e]/40 hover:border-[#3ecf8e] text-[#3ecf8e] hover:text-white font-semibold text-xs shadow-[0_0_15px_rgba(62,207,142,0.18)] hover:shadow-[0_0_22px_rgba(62,207,142,0.35)] transition-all transform hover:-translate-y-0.5 cursor-pointer shrink-0"
      title="LAC Cell Analyzer (laccelldecoder.com)"
    >
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#3ecf8e] opacity-80"></span>
        <span className="relative inline-flex rounded-full h-2 w-2 bg-[#3ecf8e]"></span>
      </span>
      <Radio className="h-3.5 w-3.5 text-[#3ecf8e] shrink-0" />
      <span className={`tracking-wide ${compact ? 'hidden sm:inline' : 'inline'}`}>
        LAC Cell Analyzer
      </span>
      <ExternalLink className="h-3 w-3 text-[#3ecf8e]/70 group-hover:text-white group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform shrink-0" />
    </a>
  );
}

/**
 * WhatsApp Contact button
 */
export function WhatsAppContactButton({ compact = false }: { compact?: boolean }) {
  return (
    <a
      href={WHATSAPP_URL}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#25D366]/15 border border-[#25D366]/40 hover:border-[#25D366] hover:bg-[#25D366]/25 text-[#25D366] hover:text-white font-semibold text-xs shadow-[0_0_15px_rgba(37,211,102,0.18)] hover:shadow-[0_0_22px_rgba(37,211,102,0.35)] transition-all transform hover:-translate-y-0.5 cursor-pointer shrink-0"
      title={`WhatsApp Support: ${WHATSAPP_NUMBER}`}
    >
      <WhatsAppIcon className="h-3.5 w-3.5 fill-current shrink-0" />
      <span className={`tracking-wide ${compact ? 'hidden md:inline' : 'inline'}`}>
        WhatsApp Contact
      </span>
    </a>
  );
}

/**
 * Top Header Quick Actions container
 */
export function HeaderExternalActions() {
  return (
    <div className="flex items-center gap-2.5">
      <LacCellAnalyzerButton compact />
      <WhatsAppContactButton compact />
    </div>
  );
}
