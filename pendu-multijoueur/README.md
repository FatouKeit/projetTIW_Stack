# Jeu du Pendu Multijoueur – Projet TIW Web Stack

Ce projet est une application web multijoueur du jeu du pendu, développée avec **Node.js**, **WebSocket**, **React** et **Tailwind CSS**.

## Fonctionnement général

Le jeu se déroule en 3 étapes principales :

1. **HomePage** :  
   - Page d'accueil où le joueur peut créer une partie.

2. **RoomPage** :  
   - Une salle d'attente s'affiche jusqu'à ce que **deux(02) joueurs** soient connectés.

3. **GamePage** :  
   - Le jeu commence : les joueurs jouent **à tour de rôle**.
   - Chaque lettre trouvée rapporte **1 point**.
   - Le **score de chaque joueur** est affiché dans un tableau.
   - Les joueurs gagnent ou perdent ensemble.
   - Lorsqu'un joueur quitte le jeu, l’**autre est automatiquement averti**.
   - Un bouton permet de **rejouer** une nouvelle partie avec un mot différent.

## Tester l'application

Le projet peut être lancé en mode développement ou en version production compilée dans le dossier `dist`.  
Configuration deja établie dans server.ts, PORT : 3001.

---

> Réalisé par **Fatoumata KEITA** et **Yannick COMPAORE** – Master TIW en TWSMD.
