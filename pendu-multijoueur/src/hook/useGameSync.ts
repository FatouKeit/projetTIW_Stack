import { useEffect, useRef, useState } from 'react';

type GameState = {
  displayWord: string;
  guessedLetters: string[];
  wrongGuesses: number;
  isWon: boolean;
  isLost: boolean;
  currentTurn: 'player1' | 'player2';
  secretWord?: string;
  scores?: { role: 'player1' | 'player2', score: number }[];
};

export const useGameSync = (roomId: string) => {
  const [gameState, setGameState] = useState<GameState>({
    displayWord: '',
    guessedLetters: [],
    wrongGuesses: 0,
    isWon: false,
    isLost: false,
    currentTurn: 'player1',
  });
  const [messages, setMessages] = useState<string[]>([]);
  const [role, setRole] = useState<'player1' | 'player2' | null>(null);
  const [connected, setConnected] = useState<boolean>(false);

  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const ws = new WebSocket('ws://localhost:3001');
    socketRef.current = ws;

    ws.onopen = () => {
      setConnected(true);
      ws.send(JSON.stringify({ type: 'join-room', roomId }));
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);

      switch (data.type) {
        case 'init':
          sessionStorage.setItem('role', data.role);
          setRole(data.role);
          break;

        case 'start-game':
          setGameState({
            displayWord: '_'.repeat(data.secretWordLength),
            guessedLetters: [],
            wrongGuesses: 0,
            isWon: false,
            isLost: false,
            currentTurn: data.currentTurn || 'player1', // si fourni par serveur
          });
          setMessages([]);
          break;

        case 'update':
          setGameState({
            displayWord: data.displayWord,
            guessedLetters: data.guessedLetters,
            wrongGuesses: data.wrongGuesses,
            isWon: data.isWon,
            isLost: data.isLost,
            currentTurn: data.currentTurn,
            secretWord: data.secretWord,
            scores: data.scores,
          });
          break;

        case 'message':
          setMessages((prev) => [...prev, data.message]);
          break;

        case 'error':
          setMessages((prev) => [...prev, `Erreur : ${data.message}`]);
          break;

        default:
          console.warn('Message WebSocket inconnu:', data);
          break;
      }
    };

    ws.onerror = () => {
      setConnected(false);
      setMessages((prev) => [...prev, 'Erreur de connexion WebSocket.']);
      console.error('WebSocket error');
    };

    ws.onclose = () => {
      setConnected(false);
      setMessages((prev) => [...prev, 'Connexion WebSocket fermée.']);
    };

    return () => {
      ws.close();
      socketRef.current = null;
    };
  }, [roomId]);

  const guessLetter = (letter: string) => {
    if (!letter.match(/^[a-zA-Z]$/)) {
      console.warn("Lettre invalide envoyée:", letter);
      return;
    }
    const ws = socketRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'guess', letter }));
    } else {
      console.warn("Le WebSocket n'est pas connecté.");
    }
  };

  const replayGame = () => {
  const ws = socketRef.current;
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ type: 'replay' }));  // ou 'start-game' selon ton serveur
  } else {
    console.warn("WebSocket non connecté, impossible de relancer la partie.");
  }
};

  return {
    gameState,
    guessLetter,
    role,
    messages,
    connected,
    replayGame
  };
};
