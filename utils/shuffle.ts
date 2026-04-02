export function getDeterministicShuffle<T>(options: T[], restartCount: number, stableKey: string): T[] {
  if (restartCount === 0 || !options || options.length === 0) return options || [];
  
  let hash = 0;
  const str = stableKey + restartCount;
  for (let i = 0; i < str.length; i++) {
      hash = Math.imul(31, hash) + str.charCodeAt(i) | 0;
  }
  const pseudoRandom = () => {
      hash = Math.imul(741103597, hash) + 1 | 0;
      let t = Math.imul(hash ^ (hash >>> 15), 1597334677);
      t = (t ^ (t >>> 15)) * (1.0 / 4294967296);
      return t + 0.5;
  };

  const shuffled = [...options];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(pseudoRandom() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}
