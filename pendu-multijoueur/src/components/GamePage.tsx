import  { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import LePendu from '../components/LePendu';

const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

export default function GamePage() {
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [displayWord, setDisplayWord] = useState('');
  const [guessedLetters, setGuessedLetters] = useState<string[]>([]);
  const [wrongGuesses, setWrongGuesses] = useState(0);
  const [maxWrongGuesses, setMaxWrongGuesses] = useState(6);
  const [isWon, setIsWon] = useState(false);
  const [isLost, setIsLost] = useState(false);
  const [status, setStatus] = useState('Connexion en cours...');
  const navigate = useNavigate();
  const [role, setRole] = useState<'player1' | 'player2' | null>(null);
  const [currentTurn, setCurrentTurn] = useState<'player1' | 'player2' | null>(null);

useEffect(() => {
  const roomId = sessionStorage.getItem('roomId');
  const storedRole = sessionStorage.getItem('role'); // ⚠️ utiliser ça au début
  console.log('Rôle (stocké):', storedRole, 'Tour actuel:', currentTurn);

  if (!roomId) {
    alert("Les informations de la session sont manquantes. Retour à l'accueil.");
    navigate('/');
    return;
  }

  const socket = new WebSocket('ws://localhost:3001');
  setWs(socket);

  let isUnmounting = false;

  socket.onopen = () => {
    socket.send(JSON.stringify({ type: 'join-room', roomId }));
  };

  socket.onmessage = (event) => {
    const data = JSON.parse(event.data);

    switch (data.type) {
      case 'init':
        setRole(data.role); // ✅ défini une fois reçu du serveur
        sessionStorage.setItem('role', data.role); // ⚠️ stocker dans sessionStorage pour cohérence
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
        break;

case 'update':
  setDisplayWord(data.displayWord);
  setGuessedLetters(data.guessedLetters);
  setWrongGuesses(data.wrongGuesses);
  setIsWon(data.isWon);
  setIsLost(data.isLost);
  setCurrentTurn(data.currentTurn);

  if (data.isWon) {
    setStatus('🎉 Vous avez gagné !');
  } else if (data.isLost) {
    setStatus(`💀 Vous avez perdu ! Le mot était "${data.secretWord}"`);
  } else {
    
    if (data.currentTurn === storedRole) {
      setStatus('À vous de jouer...');
    } else {
      setStatus('En attente du joueur adverse...');
    }
  }
  break;

      case 'message':
        alert(data.message);
        break;

      default:
        console.warn('Type de message inconnu :', data.type);
    }
  };

  socket.onerror = () => {
    if (!isUnmounting) {
      alert("Erreur lors de la connexion au serveur WebSocket.");
    }
  };

  return () => {
    isUnmounting = true;
    socket.close();
  };
}, [navigate]); 


  const handleClick = (letter: string) => {
    if (!ws || guessedLetters.includes(letter.toLowerCase()) || isWon || isLost) return;   
    if (currentTurn !== role) {
    alert("Ce n'est pas votre tour !");
    return;
  }
  ws.send(JSON.stringify({ type: 'guess', letter }));
  };

  const handleReplay = () => {
    if (ws) {
      ws.send(JSON.stringify({ type: 'replay-request' }));
    }
  };

  const handleGoHome = () => {
    sessionStorage.removeItem('roomId');
    sessionStorage.removeItem('role');
    navigate('/');
  };

 return (
  <div className="min-h-screen flex flex-col items-center justify-center gap-6 p-6 bg-gray-100 text-gray-900">
    <h1 className="text-4xl font-extrabold mb-2 uppercase">Jeu du pendu</h1>

    {role && (
      <h2 className="text-lg font-medium text-gray-700">
        Vous êtes <span className="font-bold">{role === 'player1' ? 'Joueur 1' : 'Joueur 2'}</span>
      </h2>
    )}

    <h2 className="text-xl font-semibold mb-4">{status}</h2>

    <LePendu wrongGuesses={wrongGuesses} maxTries={maxWrongGuesses} />

    <div className="text-3xl font-mono tracking-widest">
      {displayWord.split('').join(' ')}
    </div>

    <div className="grid grid-cols-7 gap-2 mt-6">
      {alphabet.map((letter) => {
        // Si lettre déjà utilisée, on ne l'affiche pas (retourne null)
        if (guessedLetters.includes(letter.toLowerCase()) || isWon || isLost) {
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

    {(isWon || isLost) && (
      <div className="mt-6 flex gap-4">
        <button
          onClick={handleReplay}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
        >
          Rejouer
        </button>
        <button
          onClick={handleGoHome}
          className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
        >
          Accueil
        </button>
      </div>
    )}
  </div>
);

}
