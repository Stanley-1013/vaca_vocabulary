import React, { useState, useEffect, useCallback } from 'react';
import { Card as CardType, Quality } from '../../types';
import MediaEmbed from './MediaEmbed';
import ReviewControls from './ReviewControls';

interface CardProps {
  card: CardType;
  onFlip?: (face: 'front' | 'meaning' | 'example') => void;
  onNext?: () => void;
  onReview?: (quality: Quality) => Promise<void>;
  isLoading?: boolean;
  showNavigationHints?: boolean;
}

type CardFace = 'front' | 'meaning' | 'example';

const Card: React.FC<CardProps> = ({ 
  card, 
  onFlip, 
  onNext,
  onReview, 
  isLoading = false,
  showNavigationHints = true 
}) => {
  const [currentFace, setCurrentFace] = useState<CardFace>('front');

  const handleFaceChange = useCallback((newFace: CardFace) => {
    setCurrentFace(newFace);
    onFlip?.(newFace);
  }, [onFlip]);

  const handleKeyPress = useCallback((event: KeyboardEvent) => {
    switch (event.key) {
      case 'ArrowRight':
      case ' ':
        event.preventDefault();
        if (currentFace === 'front') handleFaceChange('meaning');
        else if (currentFace === 'meaning') handleFaceChange('example');
        break;
      case 'ArrowLeft':
        event.preventDefault();
        if (currentFace === 'example') handleFaceChange('meaning');
        else if (currentFace === 'meaning') handleFaceChange('front');
        break;
      case 'ArrowDown':
        event.preventDefault();
        onNext?.();
        break;
    }
  }, [currentFace, handleFaceChange, onNext]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [handleKeyPress]);

  const renderCardFace = () => {
    switch (currentFace) {
      case 'front':
        return (
          <div data-testid="card-face-front" className="card-face text-white">
            <div className="text-center">
              <div className="text-4xl font-bold mb-4">{card.word.base}</div>
              <div className="text-lg text-gray-300 mb-2">{card.posPrimary}</div>
              {card.word.phonetic && <div className="text-base text-cyan-400 mb-4 font-mono">{card.word.phonetic}</div>}
              {card.word.forms && card.word.forms.length > 0 && (
                <div className="text-sm text-gray-400 space-y-1">
                  {card.word.forms.map((form, index) => (
                    <div key={index} className="flex justify-center gap-2">
                      <span className="font-medium">{form.pos}</span>
                      <span>{form.form}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );

      case 'meaning':
        return (
          <div data-testid="card-face-meaning" className="card-face text-white">
            <div className="text-center">
              <div className="text-2xl font-semibold mb-6">{card.meaning}</div>
              {(card.synonyms.length > 0 || card.antonyms.length > 0) && (
                <div className="space-y-4">
                  {card.synonyms.length > 0 && (
                    <div>
                      <div className="text-sm font-medium text-green-400 mb-2">同義詞</div>
                      <div className="flex flex-wrap justify-center gap-2">
                        {card.synonyms.map((synonym, index) => (
                          <span key={index} className="px-3 py-1 bg-green-900/50 text-green-300 rounded-full text-sm">{synonym}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {card.antonyms.length > 0 && (
                    <div>
                      <div className="text-sm font-medium text-red-400 mb-2">反義詞</div>
                      <div className="flex flex-wrap justify-center gap-2">
                        {card.antonyms.map((antonym, index) => (
                          <span key={index} className="px-3 py-1 bg-red-900/50 text-red-300 rounded-full text-sm">{antonym}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        );

      case 'example':
        return (
          <div data-testid="card-face-example" className="card-face text-white">
            <div className="space-y-6">
              <div className="text-lg leading-relaxed">"{card.example}"</div>
              {card.anchors && card.anchors.length > 0 && (
                <div className="space-y-4">
                  {card.anchors.map((anchor, index) => <MediaEmbed key={index} anchor={anchor} />)}
                </div>
              )}
            </div>
          </div>
        );
    }
  };
  
  const getFaceTitle = (face: CardFace): string => {
    switch (face) {
      case 'front': return '單字';
      case 'meaning': return '意思';
      case 'example': return '例句';
    }
  };

  return (
    <div className="w-full max-w-md mx-auto bg-gradient-to-br from-fuchsia-500/20 to-purple-600/20 rounded-lg shadow-xl backdrop-blur-sm border border-white/10">
      <div className="card-container rounded-lg p-4 sm:p-6 md:p-8 min-h-[420px] sm:min-h-[460px] flex flex-col">
        <div className="flex justify-center mb-4 sm:mb-6 border-b border-white/10 overflow-x-auto no-scrollbar">
          {(['front', 'meaning', 'example'] as CardFace[]).map((face) => (
            <button
              key={face}
              onClick={() => handleFaceChange(face)}
              className={`px-4 py-2 font-medium text-sm whitespace-nowrap transition-colors ${currentFace === face ? 'text-cyan-400 border-b-2 border-cyan-400' : 'text-gray-400 hover:text-gray-200'}`}
              data-testid={`face-tab-${face}`}
            >
              {getFaceTitle(face)}
            </button>
          ))}
        </div>

        <div className="flex-1 flex items-center justify-center">
          {renderCardFace()}
        </div>

        {onReview && (
          <div className="mt-6">
            <ReviewControls onRate={onReview} busy={isLoading} />
          </div>
        )}
      </div>
    </div>
  );
};

export default Card;