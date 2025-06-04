import express from 'express';
import http from 'http';
import WebSocket, { WebSocketServer } from 'ws';
import cors from 'cors';
import path from 'path';

const DIST_DIR = path.join(__dirname, "../pendu-multijoueur/dist");
const HTML_FILE = path.join(DIST_DIR, "index.html");

const app = express();
app.use(express.static(DIST_DIR));
app.get('/{*any}', (_req, res) => {
  res.sendFile(HTML_FILE);
});

app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const wss = new WebSocketServer({ server });

const PORT = 3001;



// ---------------------------------------------------------------------------------------------------
const words = ['javascript', 'react', 'typescript', 'vite', 'express', 'websocket', 'tailwind'];

type Player = {
  id: string;
  ws: WebSocket;
  role: 'player1' | 'player2';
  score : number
};

type Room = {
  id: string;
  players: Player[];
  secretWord: string;
  guessedLetters: string[];
  wrongGuesses: number;
  maxWrongGuesses: number;
  currentTurn: 'player1' | 'player2';
};

const rooms: Record<string, Room> = {};

function broadcastToRoom(roomId: string, data: any) {
  const message = JSON.stringify(data);
  const room = rooms[roomId];
  if (!room) return;

  room.players.forEach(p => {
    if (p.ws.readyState === WebSocket.OPEN) {
      p.ws.send(message);
    }
  });
}

app.post('/create-room', (_req, res) => {
  const roomId = Math.random().toString(36).substring(2, 8);
  res.json({ roomId });
});

wss.on('connection', (ws) => {
  let currentRoomId: string | null = null;
  let playerRole: 'player1' | 'player2' | null = null;

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message.toString());

      // --- Rejoindre une salle ---
      if (data.type === 'join-room') {
        const roomId = data.roomId;
        currentRoomId = roomId;

        if (!rooms[roomId]) {
          rooms[roomId] = {
            id: roomId,
            players: [],
            secretWord: words[Math.floor(Math.random() * words.length)],
            guessedLetters: [],
            wrongGuesses: 0,
            maxWrongGuesses: 6,
            currentTurn: 'player1',
          };
        }

        const room = rooms[roomId];

        if (room.players.length >= 2) {
          ws.send(JSON.stringify({ type: 'error', message: 'Salle pleine' }));
          ws.close();
          return;
        }

        playerRole = room.players.length === 0 ? 'player1' : 'player2';
        room.players.push({ id: playerRole, ws, role: playerRole, score: 0, });

        console.log(`Joueur ${playerRole} connecté à la room ${roomId}`);

        ws.send(JSON.stringify({ type: 'init', role: playerRole }));

        broadcastToRoom(roomId, {
          type: 'player-count',
          count: room.players.length,
        });

        if (room.players.length === 2) {
          const displayWord = room.secretWord.split('').map(() => '_').join('');
          broadcastToRoom(roomId, {
            type: 'start-game',
            secretWordLength: room.secretWord.length,
            maxWrongGuesses: room.maxWrongGuesses,
          });

          broadcastToRoom(roomId, {
            type: 'update',
            displayWord,
            guessedLetters: [],
            wrongGuesses: 0,
            isWon: false,
            isLost: false,
            currentTurn: room.currentTurn,
          });
        }
      }

      // --- Jouer une lettre ---
      else if (data.type === 'guess' && currentRoomId) {
        const room = rooms[currentRoomId];
        if (!room) return;

        const player = room.players.find(p => p.ws === ws);
        if (!player || player.role !== room.currentTurn) {
          ws.send(JSON.stringify({ type: 'message', message: "Ce n'est pas votre tour" }));
          return;
        }

        const letter = data.letter.toLowerCase();
        if (room.guessedLetters.includes(letter)) {
          ws.send(JSON.stringify({ type: 'message', message: 'Lettre déjà proposée' }));
          return;
        }

        room.guessedLetters.push(letter);
        if (!room.secretWord.includes(letter)) {
          room.wrongGuesses++;
        } else {
  const occurrences = room.secretWord.split('').filter(l => l === letter).length;
  player.score += occurrences; 
}

        const displayWord = room.secretWord
          .split('')
          .map(l => (room.guessedLetters.includes(l) ? l : '_'))
          .join('');

        const isWon = !displayWord.includes('_');
        const isLost = room.wrongGuesses >= room.maxWrongGuesses;

        if (!isWon && !isLost) {
          room.currentTurn = room.currentTurn === 'player1' ? 'player2' : 'player1';
        }

        broadcastToRoom(currentRoomId, {
          type: 'update',
          displayWord,
          guessedLetters: room.guessedLetters,
          wrongGuesses: room.wrongGuesses,
          isWon,
          isLost,
          currentTurn: room.currentTurn,
          secretWord: isLost ? room.secretWord : undefined,
          scores: room.players.map(p => ({ role: p.role, score: p.score })),
        });
      }

      // --- Rejouer ---
      else if (data.type === 'replay' && currentRoomId) {
        console.log(`🔁 Rejouer demandé dans la room ${currentRoomId}`);
        const room = rooms[currentRoomId];
        if (!room) return;

        room.secretWord = words[Math.floor(Math.random() * words.length)];
        room.guessedLetters = [];
        room.wrongGuesses = 0;
        room.currentTurn = 'player1';
        room.players.forEach(p => p.score = 0);

        const displayWord = room.secretWord.split('').map(() => '_').join('');

        broadcastToRoom(currentRoomId, {
          type: 'start-game',
          secretWordLength: room.secretWord.length,
          maxWrongGuesses: room.maxWrongGuesses,
        });

        broadcastToRoom(currentRoomId, {
          type: 'update',
          displayWord,
          guessedLetters: [],
          wrongGuesses: 0,
          isWon: false,
          isLost: false,
          currentTurn: room.currentTurn,
        });
      }

    } catch (err) {
      console.error('Erreur sur message reçu :', err);
      ws.send(JSON.stringify({ type: 'error', message: 'Message invalide ou erreur serveur' }));
    }
  });

  ws.on('close', () => {
   
   if (!currentRoomId) return;
    const room = rooms[currentRoomId];
    if (!room) return;

    const index = room.players.findIndex(p => p.ws === ws);
    if (index !== -1) {
      const leavingPlayer = room.players[index];
      console.log(`Joueur ${leavingPlayer.id} déconnecté de la room ${currentRoomId}`);
      room.players.splice(index, 1);

      if (room.players.length === 1) {
        const remainingPlayer = room.players[0];
        if (remainingPlayer.ws.readyState === WebSocket.OPEN) {
          remainingPlayer.ws.send(JSON.stringify({
            type: 'message',
            message: "Partie terminée, l'autre joueur a quitté la partie.",
          }));
        }
      }

      if (room.players.length === 0) {
        delete rooms[currentRoomId];
        console.log(`Room ${currentRoomId} supprimée car vide`);
      }
    }
  });
});

server.listen(PORT, () => {
  console.log(`Serveur lancé sur http://localhost:${PORT}`);
});
