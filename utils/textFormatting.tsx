import React from "react";
import { AudioButton } from "@/components/common/AudioButton";

export const renderFormattedText = (text: string) => {
  if (!text) return null;
  const parts = text.split(/(\/[^\/]+\/)/g);
  return (
    <span className="leading-relaxed">
      {parts.map((part, i) => {
         if (part.startsWith('/') && part.endsWith('/')) {
           const textBefore = i > 0 ? parts[i-1] : '';
           let wordToSpeak = '';
           const strictQuoteMatch = textBefore.match(/['"]([^'"]+)['"]\s*$/);
           if (strictQuoteMatch) {
             wordToSpeak = strictQuoteMatch[1];
           } else {
             const words = textBefore.trim().split(/\s+/);
             if (words.length <= 3) {
               wordToSpeak = textBefore.replace(/['":;,.()]/g, '').trim();
             } else {
               wordToSpeak = words[words.length - 1].replace(/['":;,.()]/g, '');
             }
           }
           
           return (
             <span key={i} className="inline-flex items-center whitespace-nowrap px-2 py-0.5 mx-0.5 bg-indigo-50/80 text-indigo-700 font-medium rounded-lg text-[0.9em] tracking-wide align-baseline border border-indigo-100/50">
               {part}
               <AudioButton text={wordToSpeak} />
             </span>
           );
         }
         return <span key={i}>{part}</span>;
      })}
    </span>
  );
};
