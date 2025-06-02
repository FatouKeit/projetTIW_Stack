import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

export const RoomPage: React.FC = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const [connectedPlayers, setConnectedPlayers] = useState(1);

  useEffect(() => {
    const socket = new WebSocket(`ws://localhost:3001`);

    let isUnmounting = false;

    socket.onopen = () => {
      socket.send(
        JSON.stringify({
          type: "join-room",
          roomId,
        })
      );
    };

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.type === "player-count") {
        setConnectedPlayers(data.count);
      }

      if (data.type === "init") {
        sessionStorage.setItem("roomId", roomId as string);
        sessionStorage.setItem("role", data.role);
      }

      if (data.type === "start-game") {
        navigate(`/game/${roomId}`);
      }
    };

    // 🔧 Correction ici : suppression du paramètre inutilisé
    socket.onerror = () => {
      if (!isUnmounting) {
        alert("Erreur lors de la connexion au serveur WebSocket.");
      }
    };

    return () => {
      isUnmounting = true;
      socket.close();
    };
  }, [roomId, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4">
      <div className="bg-white border border-gray-300 shadow-md rounded-2xl p-8 max-w-md w-full text-center">
        <h1 className="text-4xl font-extrabold text-blue-600 mb-4">Salle d’attente</h1>
        <p className="text-lg text-gray-700 mb-2">
          <span className="font-semibold">ID de la salle :</span> {roomId}
        </p>
        <p className="text-lg text-gray-700">
          <span className="font-semibold">Joueurs connectés :</span> {connectedPlayers}/2
        </p>
        <div className="mt-6">
          <div className="w-full h-2 bg-gray-200 rounded-full">
            <div
              className={`h-2 rounded-full transition-all duration-500 ${
                connectedPlayers === 2 ? "bg-green-500 w-full" : "bg-yellow-400 w-1/2"
              }`}
            ></div>
          </div>
          <p className="text-sm text-gray-500 mt-3 italic">
            En attente de l’autre joueur…
          </p>
        </div>
      </div>
    </div>
  );
};

export default RoomPage;
