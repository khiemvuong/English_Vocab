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
           // Extract phrase from an unclosed opening quote, if present
           let extractedPhrase = textBefore;
           const openingQuoteMatch = textBefore.match(/(?:^|[\s(])(['"])([^'"]*)$/);
           if (openingQuoteMatch) {
             extractedPhrase = openingQuoteMatch[2];
           }
           
           // Count phonetic words (roughly by spaces)
           const phoneticWordsCount = part.trim().split(/\s+/).length;
           
           // Extract target words from the phrase
           const words = extractedPhrase.trim().split(/\s+/);
           const targetWords = words.slice(-phoneticWordsCount);
           
           wordToSpeak = targetWords.join(' ').replace(/['":;,.()?!]/g, '').trim();
           
           // Fallback if something went wrong
           if (!wordToSpeak) {
             wordToSpeak = extractedPhrase.replace(/['":;,.()?!]/g, '').trim();
           }
           
           return (
             <span key={i} className="inline-flex items-center whitespace-nowrap px-2.5 py-0.5 mx-1 bg-indigo-500/15 text-indigo-300 font-semibold rounded-lg text-[0.88em] tracking-wide align-baseline border border-indigo-500/25 shadow-[0_0_8px_rgba(99,102,241,0.15)] transition-all">
               {part}
               <AudioButton 
                 text={wordToSpeak} 
                 className="ml-1 p-0.5 text-indigo-400 hover:text-indigo-200 hover:bg-white/10 rounded-full transition-colors active:scale-90"
               />
             </span>
           );
         }
         return <span key={i}>{part}</span>;
      })}
    </span>
  );
};
