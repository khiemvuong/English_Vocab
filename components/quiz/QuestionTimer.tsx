import { useEffect, useState } from "react";

interface QuestionTimerProps {
  currentIndex: number;
  isAnswered: boolean;
  duration?: number;
}

export function QuestionTimer({ currentIndex, isAnswered, duration = 30 }: QuestionTimerProps) {
  const [timeLeft, setTimeLeft] = useState(duration);
  const [showTip, setShowTip] = useState(true);
  const [hasDismissedTip, setHasDismissedTip] = useState(false);

  // Reset timer whenever the question changes
  useEffect(() => {
    setTimeLeft(duration);
  }, [currentIndex, duration]);

  // Handle countdown
  useEffect(() => {
    if (isAnswered || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [isAnswered, timeLeft]);

  // Auto-hide tip after a few questions if they haven't manually closed it
  useEffect(() => {
    if (currentIndex >= 3 && !hasDismissedTip) {
      setShowTip(false);
    }
  }, [currentIndex, hasDismissedTip]);

  const handleRestart = () => {
    setTimeLeft(duration);
  };

  const isWarning = timeLeft <= 10 && timeLeft > 0;
  const isDanger = timeLeft === 0;

  return (
    <div className="fixed bottom-24 right-4 md:right-8 z-40 flex flex-col items-end gap-3 pointer-events-none">
      {/* Floating Tip Card */}
      {showTip && (
        <div className="bg-blue-50 border border-blue-200 shadow-lg shadow-blue-500/10 rounded-2xl p-3 md:p-4 max-w-[200px] md:max-w-xs animate-in slide-in-from-right-8 fade-in slide-in-from-bottom-2 duration-500 pointer-events-auto relative">
          <button 
            onClick={() => {
              setShowTip(false);
              setHasDismissedTip(true);
            }}
            className="absolute top-2 right-2 p-1 text-blue-400 hover:text-blue-600 rounded-full transition-colors"
            title="Đóng gợi ý"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
          <div className="flex gap-2.5">
            <span className="text-xl shrink-0">💡</span>
            <div className="pr-2">
              <p className="text-xs md:text-sm font-bold text-blue-900 mb-1">Mẹo canh thời gian</p>
              <p className="text-[10px] md:text-xs text-blue-800/80 leading-relaxed font-medium">
                Để kịp làm bài thi TOEIC thực tế, bạn chỉ nên dành tối đa <strong>30 giây</strong> cho mỗi câu Part 5 thôi nhé!
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Timer Pill */}
      <div 
        className={`pointer-events-auto flex items-center gap-2 px-3 py-2 md:px-4 md:py-2.5 rounded-2xl border shadow-xl backdrop-blur-md transition-all duration-500 hover:-translate-y-1
          ${isDanger 
            ? 'bg-rose-50 border-rose-200 shadow-rose-500/20 text-rose-600 animate-in slide-in-from-bottom-2' 
            : isWarning 
              ? 'bg-amber-50 border-amber-200 shadow-amber-500/20 text-amber-600' 
              : 'bg-white/95 border-slate-200 shadow-slate-900/10 text-slate-700'
          }`}
      >
        <svg className={`w-4 h-4 md:w-5 md:h-5 ${timeLeft > 0 && timeLeft <= 5 && !isAnswered ? 'animate-pulse text-amber-500' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span className={`font-mono font-bold text-sm md:text-base w-[2ch] shrink-0 text-center ${isDanger ? 'text-rose-600' : ''}`}>
          {timeLeft}
        </span>
        <span className="text-[10px] md:text-xs font-semibold uppercase tracking-wider opacity-60 mr-1">giây</span>
        
        {/* Restart Button */}
        <div className="w-px h-5 bg-slate-200 mx-0.5"></div>
        <button 
          onClick={handleRestart}
          title="Bắt đầu lại đồng hồ"
          className={`p-1.5 rounded-full transition-colors active:scale-90 ${isDanger ? 'hover:bg-rose-100 text-rose-500' : isWarning ? 'hover:bg-amber-100 text-amber-600' : 'hover:bg-slate-100 text-slate-500'}`}
        >
          <svg className="w-3.5 h-3.5 md:w-4 md:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>
    </div>
  );
}
