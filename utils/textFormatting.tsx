import React from "react";
import { AudioButton } from "@/components/common/AudioButton";

export const getSpeakableText = (text: string) => {
  if (!text) return "";

  const parts = text.split(/(\/[^\/]+\/)/g);
  const phoneticIndex = parts.findIndex((part) => part.startsWith("/") && part.endsWith("/"));
  if (phoneticIndex === -1) return "";

  const textBefore = phoneticIndex > 0 ? parts[phoneticIndex - 1] : "";
  let extractedPhrase = textBefore;
  const openingQuoteMatch = textBefore.match(/(?:^|[\s(])(['"])([^'"]*)$/);

  if (openingQuoteMatch) {
    extractedPhrase = openingQuoteMatch[2];
  }

  const phoneticWordsCount = parts[phoneticIndex].trim().split(/\s+/).length;
  const targetWords = extractedPhrase.trim().split(/\s+/).slice(-phoneticWordsCount);
  const wordToSpeak = targetWords.join(" ").replace(/['":;,.()?!]/g, "").trim();

  return wordToSpeak || extractedPhrase.replace(/['":;,.()?!]/g, "").trim();
};

export const renderFormattedText = (text: string) => {
  if (!text) return null;
  const parts = text.split(/(\/[^\/]+\/)/g);
  return (
    <span className="leading-relaxed">
      {parts.map((part, i) => {
         if (part.startsWith('/') && part.endsWith('/')) {
           const wordToSpeak = getSpeakableText(`${parts[i - 1] ?? ""}${part}`);
           
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
