import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import LePendu from '../components/LePendu';

const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

export default function GamePage() {
  const [displayWord, setDisplayWord] = useState('');
  const [guessedLetters, setGuessedLetters] = useState<string[]>([]);
  const [wrongGuesses, setWrongGuesses] = useState(0);
  const [maxWrongGuesses, setMaxWrongGuesses] = useState(6);
  const [isWon, setIsWon] = useState(false);
  const [isLost, setIsLost] = useState(false);
  const [status, setStatus] = useState('Connexion en cours...');
  const [role, setRole] = useState<'player1' | 'player2' | null>(null);
  const [currentTurn, setCurrentTurn] = useState<'player1' | 'player2' | null>(null);
  const [isOpponentDisconnected, setIsOpponentDisconnected] = useState(false);
  const navigate = useNavigate();

  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const roomId = sessionStorage.getItem('roomId');

    if (!roomId) {
      alert("Les informations de la session sont manquantes. Retour à l'accueil.");
      navigate('/');
      return;
    }

    const socket = new WebSocket('ws://localhost:3001');
    wsRef.current = socket;

    let isUnmounting = false;

 socket.onopen = () => {
    // Envoie immédiat dès ouverture de la socket
    socket.send(JSON.stringify({
      type: 'join-room',
      roomId,
    }));
  };

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);

      switch (data.type) {
        case 'init':
          setRole(data.role);
          sessionStorage.setItem('role', data.role);
          setStatus(`Connecté en tant que ${data.role === 'player1' ? 'Joueur 1' : 'Joueur 2'}`);
          break;

        case 'start-game':
          setDisplayWord('_'.repeat(data.secretWordLength));
          setMaxWrongGuesses(data.maxWrongGuesses);
          setStatus('La partie a commencé !');
          setIsWon(false);
          setIsLost(false);
          setGuessedLetters([]);
          setWrongGuesses(0);
          setIsOpponentDisconnected(false);
          break;

        case 'update':
          setDisplayWord(data.displayWord);
          setGuessedLetters(data.guessedLetters);
          setWrongGuesses(data.wrongGuesses);
          setIsWon(data.isWon);
          setIsLost(data.isLost);
          setCurrentTurn(data.currentTurn);

const localRole = sessionStorage.getItem('role');
if (data.isWon) {
  setStatus('🎉 Vous avez gagné !');
} else if (data.isLost) {
  setStatus(`💀 Vous avez perdu ! Le mot était "${data.secretWord}"`);
} else if (localRole) {
  if (data.currentTurn === localRole) {
    setStatus('À vous de jouer...');
  } else {
    setStatus('En attente du joueur adverse...');
  }
} else {
  // On attend que le rôle soit bien défini avant de mettre à jour le statut
  setStatus('Chargement des informations de jeu...');
}

          break;

        case 'player-left':
          setIsOpponentDisconnected(true);
          setStatus("⚠️ Partie terminée, l'autre joueur a quitté la partie.");
          break;

        case 'message':
          alert(data.message);
          break;

        default:
          console.warn('Type de message inconnu :', data.type);
      }
    };

    socket.onerror = (err) => {
      console.error("WebSocket error:", err);
      if (!isUnmounting) {
        alert("Erreur lors de la connexion au serveur WebSocket.");
      }
    };

    return () => {
      isUnmounting = true;
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'leave-room' }));
      }
      wsRef.current?.close();
    };
  }, [navigate]);

  const handleClick = (letter: string) => {
    if (
      !wsRef.current ||
      guessedLetters.includes(letter.toLowerCase()) ||
      isWon ||
      isLost ||
      isOpponentDisconnected
    ) return;

    if (currentTurn !== role) {
      alert("Ce n'est pas votre tour !");
      return;
    }

    if (wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'guess', letter }));
    } else {
      console.warn("WebSocket non prêt pour envoyer un guess.");
    }
  };

  const handleReplay = () => {
  if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
    wsRef.current.send(JSON.stringify({ type: 'replay' }));
  } else {
    alert("Connexion WebSocket non disponible.");
  }
};

  const handleGoHome = () => {
    sessionStorage.removeItem('roomId');
    sessionStorage.removeItem('role');
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-100 text-gray-900 flex flex-col">
      <div className="w-full bg-white shadow p-4 flex justify-between items-center">
        <h2 className="text-2xl font-bold uppercase">Jeu du pendu</h2>
        <button
          onClick={handleGoHome}
          className="bg-red-500 text-black px-4 py-2 rounded hover:bg-red-600"
        >
          Accueil
        </button>
      </div>

      <div className="flex flex-col items-center justify-center flex-grow gap-6 p-6">
        {/* Affichage du rôle uniquement si défini */}
        {role ? (
          <h2 className="text-lg font-medium text-gray-700">
            Vous êtes <span className="font-bold">{role === 'player1' ? 'Joueur 1' : 'Joueur 2'}</span>
          </h2>
        ) : (
          <h2 className="text-lg font-medium text-gray-700">{status}</h2>
        )}

        {/* Si le rôle est défini, on affiche aussi le statut */}
        {role && <h2 className="text-xl font-semibold text-center">{status}</h2>}

        <LePendu wrongGuesses={wrongGuesses} maxTries={maxWrongGuesses} />

        <div className="text-3xl font-mono tracking-widest">
          {displayWord.split('').join(' ')}
        </div>

        <div className="grid grid-cols-7 gap-2 mt-6">
          {alphabet.map((letter) => {
            if (
              guessedLetters.includes(letter.toLowerCase()) ||
              isWon ||
              isLost ||
              isOpponentDisconnected
            ) {
              return null;
            }

            return (
              <button
                key={letter}
                onClick={() => handleClick(letter)}
                className="p-2 rounded font-bold text-black bg-blue-400 hover:bg-blue-500"
              >
                {letter}
              </button>
            );
          })}
        </div>

        {(isWon || isLost || isOpponentDisconnected) && (
          <div className="mt-6 flex gap-4">
            {!isOpponentDisconnected && (
              <button
                onClick={handleReplay}
                className="px-4 py-2 bg-green-500 text-black rounded hover:bg-green-600"
              >
                Rejouer
              </button>
            )}
            <button
              onClick={handleGoHome}
              className="px-4 py-2 bg-gray-500 text-black rounded hover:bg-gray-600"
            >
              Accueil
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
