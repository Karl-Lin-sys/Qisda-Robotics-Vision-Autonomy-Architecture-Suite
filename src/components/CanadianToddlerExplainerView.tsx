import React, { useState } from 'react';
import { CANADIAN_TODDLER_STORIES } from '../data/roboticsContent';

export const CanadianToddlerExplainerView: React.FC = () => {
  const [revealedAnswers, setRevealedAnswers] = useState<Record<string, boolean>>({
    'story-1': true,
  });
  const [vocabularyLevel, setVocabularyLevel] = useState<'toddler' | 'side-by-side'>('side-by-side');

  const toggleAnswer = (id: string) => {
    setRevealedAnswers((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="border-b border-slate-200 pb-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-mono text-slate-500">
              04. Canadian English Toddler Explainer · Friendly Kindergarten Storytime Mode
            </p>
            <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
              How Our Friendly Robot Works (Explained for a Little Buddy in Canada, Eh!)
            </h2>
          </div>

          <div
            className="flex items-center gap-1 rounded-lg bg-slate-100 p-1"
            role="group"
            aria-label="Explanation display mode"
          >
            <button
              type="button"
              onClick={() => setVocabularyLevel('side-by-side')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                vocabularyLevel === 'side-by-side'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Toddler + Grown-Up Side-by-Side
            </button>
            <button
              type="button"
              onClick={() => setVocabularyLevel('toddler')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                vocabularyLevel === 'toddler'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Pure Toddler Storytime Only
            </button>
          </div>
        </div>
        <p className="mt-2 max-w-4xl text-sm text-slate-600 leading-relaxed">
          Every single PhD-level concept—from SE(3) Lie-Group Kalman Filtering and FlashAttention-2 Big-O math to
          Taiwan’s Trade Secrets Act—translated into warm, gentle Canadian English that a 3-year-old in Ottawa or
          Vancouver can understand right away!
        </p>
      </div>

      {/* Story Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {CANADIAN_TODDLER_STORIES.map((card) => {
          const isAnswerOpen = Boolean(revealedAnswers[card.id]);
          return (
            <div
              key={card.id}
              className="bg-white border border-slate-200 rounded-lg p-6 flex flex-col justify-between"
            >
              <div>
                <div className="text-xs font-mono text-blue-700">{card.sectionBadge}</div>
                <h3 className="mt-1 text-lg font-bold text-slate-900">{card.title}</h3>

                <p className="mt-3 text-sm text-slate-800 leading-relaxed bg-amber-50/60 border border-amber-200/80 rounded-md p-4">
                  {card.canadianStory}
                </p>

                {vocabularyLevel === 'side-by-side' && (
                  <div className="mt-4 pt-3 border-t border-slate-200">
                    <div className="text-xs font-mono text-slate-500">
                      Grown-Up Robotics Engineer Translation:
                    </div>
                    <p className="mt-1 text-xs font-mono text-slate-700 leading-relaxed">
                      {card.grownUpTranslation}
                    </p>
                  </div>
                )}
              </div>

              <div className="mt-5 pt-4 border-t border-slate-200">
                <div className="text-xs font-semibold text-slate-900">
                  Curious Little Buddy Question: “{card.interactiveQuestion}”
                </div>
                <div className="mt-2">
                  <button
                    type="button"
                    onClick={() => toggleAnswer(card.id)}
                    className="px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded hover:bg-blue-100 transition-colors whitespace-nowrap shrink-0"
                  >
                    {isAnswerOpen ? 'Hide Answer, Eh' : 'Tell Me Why, Buddy!'}
                  </button>
                </div>
                {isAnswerOpen && (
                  <p className="mt-3 text-xs text-slate-700 leading-relaxed bg-slate-50 p-3 rounded border border-slate-200">
                    {card.interactiveAnswer}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Mini Canadian Dictionary Bar */}
      <div className="bg-white border border-slate-200 rounded-lg p-5">
        <h3 className="text-sm font-semibold text-slate-900">
          04.5 Little Canadian Robot Helper Dictionary
        </h3>
        <div className="mt-3 grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
          <div className="p-3 bg-slate-50 rounded border border-slate-200">
            <div className="font-semibold text-slate-900">Toque &amp; Mittens (Modality Dropout)</div>
            <p className="mt-1 text-slate-600">
              Practicing with one eye closed so the robot still walks safely even in a snowy blizzard, eh!
            </p>
          </div>
          <div className="p-3 bg-slate-50 rounded border border-slate-200">
            <div className="font-semibold text-slate-900">Zamboni Ice Polish (OpenCV Remap)</div>
            <p className="mt-1 text-slate-600">
              Smoothing out wavy camera pictures in one fast sweep so everything lines up nice and neat!
            </p>
          </div>
          <div className="p-3 bg-slate-50 rounded border border-slate-200">
            <div className="font-semibold text-slate-900">Hockey Whistle Sync (EtherCAT DC)</div>
            <p className="mt-1 text-slate-600">
              Making sure all 12 robot knees and elbows move on the exact same tick-tock millisecond!
            </p>
          </div>
          <div className="p-3 bg-slate-50 rounded border border-slate-200">
            <div className="font-semibold text-slate-900">Sharing Sticker (Apache-2.0 Taiwan Law)</div>
            <p className="mt-1 text-slate-600">
              Sharing our own clean drawings on GitHub while keeping everyone’s private secrets safe and sound!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
