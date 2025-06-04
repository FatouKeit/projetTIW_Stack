
export interface GameState  {
  targetWord: string;
  guessedLetters: string[];
  wrongGuesses: number;
  players: string[];
  gameStarted: boolean;
}
