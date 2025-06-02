import React from "react";
import { useNavigate } from "react-router-dom";

export const HomePage: React.FC = () => {
  const navigate = useNavigate();

  const startGame = async () => {
    try {
      const res = await fetch("http://localhost:3001/create-room", {
        method: "POST",
      });

      if (!res.ok) {
        throw new Error(`Erreur HTTP: ${res.status}`);
      }

      const data = await res.json();
      const roomId = data.roomId;

      navigate(`/room/${roomId}`);
    } catch (error) {
      console.error("Erreur création room:", error);
      alert("Échec de la création de la partie. Vérifie que le serveur tourne !");
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-white text-gray-800 px-4">
     <h1 className="text-4xl font-bold mb-6 text-blue-600">Bienvenue au jeu du Pendu !</h1>
      <p className="mb-6 text-base max-w-xl text-center">
        Un jeu multijoueur où vous et un ami devez deviner le mot choisi par l’ordinateur.
      </p>
      <button
        onClick={startGame}
       className="px-6 py-3 bg-black-100 text-gray-800 border border-gray-400 rounded-lg font-medium hover:bg-gray-200 transition"
      >
        Lancer la partie
      </button>
    </div>
  );
};

export default HomePage;
