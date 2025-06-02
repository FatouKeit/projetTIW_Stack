import{ useEffect, useState } from 'react';

interface Props {
  wrongGuesses: number;
  maxTries?: number; // optionnel, par défaut 6
}

export default function LePendu({ wrongGuesses, maxTries = 6 }: Props) {
  const [visibleParts, setVisibleParts] = useState<number>(0);

  useEffect(() => {
    // Pour déclencher l'animation au changement du nombre d'erreurs
    setVisibleParts(wrongGuesses);
  }, [wrongGuesses]);

  // Couleur qui devient rouge quand on a perdu
  const strokeColor = wrongGuesses >= maxTries ? '#dc2626' : '#111827'; // rouge ou gris foncé

  // Description pour accessibilité
  const ariaDescription = `Pendu avec ${wrongGuesses} erreur${wrongGuesses > 1 ? 's' : ''} sur ${maxTries}.`;

  // Classe CSS pour l'animation fade-in
  const fadeInClass = 'opacity-0 animate-fadeIn opacity-100 transition-opacity duration-700 ease-in-out';

  return (
    <div className="flex justify-center mt-8" role="img" aria-label={ariaDescription}>
      <svg
        viewBox="0 0 200 250"
        width="100%"
        height="auto"
        className="stroke-current"
        style={{ maxWidth: 200, strokeWidth: 4, stroke: strokeColor, fill: 'none' }}
      >
        {/* Potence */}
        <line x1="20" y1="230" x2="180" y2="230" className={fadeInClass} style={{ transitionDelay: '0ms' }} />
        <line x1="60" y1="230" x2="60" y2="20" className={fadeInClass} style={{ transitionDelay: '50ms' }} />
        <line x1="60" y1="20" x2="130" y2="20" className={fadeInClass} style={{ transitionDelay: '100ms' }} />
        <line x1="130" y1="20" x2="130" y2="50" className={fadeInClass} style={{ transitionDelay: '150ms' }} />

        {/* Tête */}
        {visibleParts > 0 && (
          <circle
            cx="130"
            cy="70"
            r="20"
            className={fadeInClass}
            style={{ transitionDelay: '200ms' }}
          />
        )}

        {/* Corps */}
        {visibleParts > 1 && (
          <line
            x1="130"
            y1="90"
            x2="130"
            y2="150"
            className={fadeInClass}
            style={{ transitionDelay: '300ms' }}
          />
        )}

        {/* Bras */}
        {visibleParts > 2 && (
          <line
            x1="130"
            y1="100"
            x2="110"
            y2="130"
            className={fadeInClass}
            style={{ transitionDelay: '400ms' }}
          />
        )}
        {visibleParts > 3 && (
          <line
            x1="130"
            y1="100"
            x2="150"
            y2="130"
            className={fadeInClass}
            style={{ transitionDelay: '450ms' }}
          />
        )}

        {/* Jambes */}
        {visibleParts > 4 && (
          <line
            x1="130"
            y1="150"
            x2="115"
            y2="190"
            className={fadeInClass}
            style={{ transitionDelay: '550ms' }}
          />
        )}
        {visibleParts > 5 && (
          <line
            x1="130"
            y1="150"
            x2="145"
            y2="190"
            className={fadeInClass}
            style={{ transitionDelay: '600ms' }}
          />
        )}
      </svg>

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-5px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation-name: fadeIn;
          animation-fill-mode: forwards;
        }
      `}</style>
    </div>
  );
}
