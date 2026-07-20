import React from 'react';
import { Link2, ExternalLink, Globe, MapPin, Radio, Activity } from 'lucide-react';

const LINKS = [
  {
    title: 'OpenCellID',
    description: 'The world\'s largest open database of cell towers. Useful for validating LAC/CID geographical locations.',
    url: 'https://opencellid.org/',
    icon: <Radio className="h-5 w-5" />,
    color: 'text-blue-400',
    bg: 'bg-blue-400/10',
    border: 'border-blue-400/20'
  },
  {
    title: 'CellMapper',
    description: 'Crowdsourced cellular coverage mapping network. Helps in visualizing cell tower coverage and sector directions.',
    url: 'https://www.cellmapper.net/',
    icon: <MapPin className="h-5 w-5" />,
    color: 'text-green-400',
    bg: 'bg-green-400/10',
    border: 'border-green-400/20'
  },
  {
    title: 'Telecom Regulatory Portal',
    description: 'Official national telecommunications regulatory authority for legal frameworks, numbering plans, and operator information.',
    url: 'https://www.itu.int/',
    icon: <Globe className="h-5 w-5" />,
    color: 'text-purple-400',
    bg: 'bg-purple-400/10',
    border: 'border-purple-400/20'
  },
  {
    title: 'LAC/CID Converter',
    description: 'Convert Hexadecimal LAC and CID values to Decimal format and vice versa for accurate database querying.',
    url: 'https://www.rapidtables.com/convert/number/hex-to-decimal.html',
    icon: <Activity className="h-5 w-5" />,
    color: 'text-orange-400',
    bg: 'bg-orange-400/10',
    border: 'border-orange-400/20'
  },
];

export const UsefulLinks: React.FC = () => {
  return (
    <div className="w-full h-full flex flex-col p-6 text-left bg-[#0f0f11] animate-in fade-in duration-300 overflow-y-auto">
      <div className="mb-8">
        <h2 className="text-xl font-bold text-gray-100 flex items-center gap-2">
          <Link2 className="h-5 w-5 text-[#3ecf8e]" />
          Useful Links
        </h2>
        <p className="text-sm text-gray-400 mt-2 font-mono">
          External directories, lookup portals, and official resources for investigations
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {LINKS.map((link, i) => (
          <a
            key={i}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex flex-col bg-[#18181b] border border-[#27272a] hover:border-[#3f3f46] rounded-xl p-5 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg hover:shadow-black/50"
          >
            <div className="flex items-start justify-between mb-4">
              <div className={`h-10 w-10 rounded-lg flex items-center justify-center border ${link.bg} ${link.color} ${link.border}`}>
                {link.icon}
              </div>
              <ExternalLink className="h-4 w-4 text-gray-500 group-hover:text-gray-300 transition-colors" />
            </div>
            <h3 className="text-sm font-semibold text-gray-200 mb-2">{link.title}</h3>
            <p className="text-xs text-gray-400 leading-relaxed font-mono flex-1">
              {link.description}
            </p>
          </a>
        ))}
      </div>
    </div>
  );
};
