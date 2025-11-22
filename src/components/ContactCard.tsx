import React, { useMemo } from 'react';
import { Phone, User, FileText } from 'lucide-react';
import type {ParsedRecord} from '../types';

interface ContactCardProps {
  record: ParsedRecord;
}

export const ContactCard: React.FC<ContactCardProps> = ({ record }) => {
  
  const phoneList = useMemo(() => {
    if (!record.phoneNumber) return [];
    // Split by /, |, comma, semicolon, ampersand, backslash, or newlines
    // We do NOT split by space or hyphen to avoid breaking single numbers with formatting
    return record.phoneNumber.split(/[\/|;,&\\\n\r]+/)
      .map(s => s.trim())
      .filter(s => s.length > 0)
      .map(s => ({
        display: s,
        dial: s.replace(/[^0-9+]/g, '')
      }))
      // Filter out segments that are too short to be phone numbers (e.g. "ext")
      .filter(p => p.dial.length >= 3);
  }, [record.phoneNumber]);

  const hasMultiple = phoneList.length > 1;
  const primaryPhone = phoneList[0];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex items-start justify-between gap-4 hover:shadow-md transition-shadow">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <User className="w-4 h-4 text-gray-400 shrink-0" />
          <h3 className="text-gray-900 font-semibold truncate">
            {record.name || 'Unknown Name'}
          </h3>
        </div>
        
        {record.description && (
          <div className="flex items-start gap-2 mb-2">
             <FileText className="w-3 h-3 text-gray-400 mt-1 shrink-0" />
             <p className="text-sm text-gray-500 line-clamp-2">
               {record.description}
             </p>
          </div>
        )}
        
        {hasMultiple ? (
          <div className="mt-3 space-y-2">
            {phoneList.map((phone, idx) => (
              <div key={idx} className="flex items-center justify-between bg-teal-50/50 rounded-lg pl-3 pr-1 py-1.5 border border-teal-100/50">
                <span className="text-xs font-mono text-gray-700 truncate mr-2">{phone.display}</span>
                <a 
                   href={`tel:${phone.dial}`}
                   className="p-2 bg-teal-100 text-teal-700 rounded-full hover:bg-teal-200 transition-colors active:bg-teal-300"
                   aria-label={`Call ${phone.display}`}
                 >
                   <Phone className="w-3.5 h-3.5" />
                 </a>
              </div>
            ))}
          </div>
        ) : (
           <div className="inline-flex items-center px-2 py-1 rounded-md bg-gray-50 border border-gray-100">
             <span className="text-xs font-mono text-gray-600">
                {primaryPhone ? primaryPhone.display : (record.phoneNumber || 'No Number')}
             </span>
           </div>
        )}
      </div>

      {!hasMultiple && primaryPhone && (
        <a
          href={`tel:${primaryPhone.dial}`}
          className="flex flex-col items-center justify-center bg-teal-600 active:bg-teal-700 text-white w-12 h-12 rounded-full shadow-lg shadow-teal-600/20 hover:scale-105 transition-all shrink-0 self-center"
          aria-label={`Call ${record.name}`}
        >
          <Phone className="w-5 h-5" />
        </a>
      )}
    </div>
  );
};
