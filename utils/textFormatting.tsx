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
