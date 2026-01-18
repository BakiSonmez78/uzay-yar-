import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { soundManager } from './utils/soundManager';
import Welcome from './components/Welcome';
import Login from './components/Login';
import Menu from './components/Menu';
import Lobby from './components/Lobby';
import Game from './components/Game';
import Results from './components/Results';
import Matchmaking from './components/Matchmaking';
import Leaderboard from './components/Leaderboard';
import Tournament from './components/Tournament';
import VConsole from 'vconsole';

// Init vConsole for mobile debugging
if (window.location.search.includes('debug')) {
  new VConsole();
}

// Determine API URL based on environment
const getApiUrl = () => {
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return 'http://localhost:3001';
  }
  // Auto-detected local IP
  // return 'http://192.168.1.59:3001';

  // Production Backend (Render)
  return 'https://uzay-yarisi-backend.onrender.com';
};

// Initialize socket lazily
let socket;

const getSocket = () => {
  if (!socket) {
    socket = io(getApiUrl(), {
      reconnection: true,
      reconnectionAttempts: 5,
      transports: ['websocket', 'polling']
    });
  }
  return socket;
};

function App() {
  const [gameState, setGameState] = useState('welcome'); // welcome, login, menu, lobby, matchmaking, playing, results
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userData, setUserData] = useState({ name: '', avatar: '', uid: '', isGuest: false });
  const [gameMode, setGameMode] = useState(null);
  const [gameData, setGameData] = useState(null); // { roomId, questions, opponent, ... }
  const [finalScore, setFinalScore] = useState(0);
  const [opponentScore, setOpponentScore] = useState(0);
  const [userTotalScore, setUserTotalScore] = useState(0); // Session score tracking

  // Stable Player ID
  const playerIdRef = useRef(null);
  if (!playerIdRef.current) {
    // Simple random ID generator
    playerIdRef.current = 'player_' + Math.random().toString(36).substr(2, 9);
    console.log('Generated Stable Player ID:', playerIdRef.current);
  }

  const [isConnected, setIsConnected] = useState(false);

  console.log("App Render: gameState =", gameState);

  useEffect(() => {
    const socket = getSocket();

    socket.on('connect', () => {
      console.log('Connected to server');
      setIsConnected(true);
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from server');
      setIsConnected(false);
    });

    socket.on('match_found', (data) => {
      console.log('Match found!', data);
      soundManager.stopMusic(); // Stop music when game starts
      setGameData(data);
      setGameState('playing');
    });

    socket.on('opponent_score', (data) => {
      setOpponentScore(data.score);
    });

    socket.on('question_solved', ({ newScores }) => {
      console.log('Received question_solved:', newScores);

      const myId = playerIdRef.current;
      const contextPlayers = Object.keys(newScores);
      const opponentId = contextPlayers.find(id => id !== myId);

      if (opponentId) {
        setOpponentScore(newScores[opponentId]);
        console.log('Setting opponent score for ID', opponentId, ':', newScores[opponentId]);
      } else {
        console.warn('Opponent ID not found in scores:', newScores);
      }
    });

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('match_found');
      socket.off('opponent_score');
      socket.off('question_solved');
    };
  }, []);

  const handleStart = (name, avatar) => {
    // Keep user data from login, just update if needed
    setUserData(prev => ({ ...prev, name: name || prev.name, avatar: avatar || prev.avatar }));
    setGameState('lobby');
  };

  const handleShowLeaderboard = () => {
    setGameState('leaderboard');
  };

  const handleShowTournament = () => {
    setGameState('tournament');
  };

  const handleBackFromLeaderboard = () => {
    setGameState('menu');
  };

  const handleBackFromTournament = () => {
    setGameState('menu');
  };

  const handleSelectMode = (mode, matchType, botDifficulty = 'medium') => {
    setGameMode(mode);
    setGameState('matchmaking');
    getSocket().emit('join_queue', {
      name: userData.name,
      avatar: userData.avatar,
      mode,
      matchType,
      botDifficulty,
      playerId: playerIdRef.current // Send Stable ID
    });
  };

  const handleFinish = async (result) => {
    // Support both direct score (legacy/fallback) and object with opScore
    const myScore = typeof result === 'object' ? result.score : result;
    const opScore = typeof result === 'object' ? result.opScore : opponentScore;

    setFinalScore(myScore);
    setUserTotalScore(prev => prev + myScore); // Accumulate score
    if (typeof result === 'object') {
      setOpponentScore(opScore); // Explicitly update opponent score from Game state
      // Save to server leaderboard
      const currentSocket = getSocket(); // Get the socket instance
      if (currentSocket) {
        currentSocket.emit('game_over', { roomId: gameData.roomId, score: myScore });
      }

      // Save to Firebase Firestore (New)
      try {
        const { addDoc, collection } = await import('firebase/firestore');
        const { db } = await import('./firebase');
        const myCountry = Object.values(gameData.players).find(p => p.name === userData.name)?.country;
        await addDoc(collection(db, "scores"), {
          name: userData.name,
          score: myScore,
          country: myCountry || 'TR',
          avatar: userData.avatar,
          date: Date.now()
        });
        console.log("Score saved to Firestore!");
      } catch (e) {
        console.error("Error saving to Firestore:", e);
      }
    }

    setGameState('results');
  };

  const handleEnterGame = () => {
    console.log("App: handleEnterGame called. Switching to 'login'");
    setGameState('login');
  };

  const handleLoginSuccess = (user) => {
    console.log("App: Login successful", user);
    setUserData(user);
    setIsAuthenticated(true);
    setGameState('menu');
  };

  const handleRestart = () => {
    if (gameState === 'matchmaking') {
      getSocket().emit('leave_queue');
    }
    setGameState('menu'); // Return to Main Hub
    setFinalScore(0);
    setOpponentScore(0);
    setGameData(null);
  };

  return (
    <div className="app-container">
      {gameState === 'welcome' && <Welcome onStart={handleEnterGame} />}
      {gameState === 'login' && <Login onLoginSuccess={handleLoginSuccess} />}
      {gameState === 'menu' && <Menu userData={userData} onStart={handleStart} onShowLeaderboard={handleShowLeaderboard} onShowTournament={handleShowTournament} totalScore={userTotalScore} />}

      {gameState === 'leaderboard' && (
        <Leaderboard
          socket={getSocket()}
          onBack={handleBackFromLeaderboard}
        />
      )}

      {gameState === 'tournament' && (
        <Tournament
          socket={getSocket()}
          userData={userData}
          onBack={handleBackFromTournament}
          onStartMatch={(gameData) => {
            setGameData(gameData);
            setGameState('playing');
          }}
        />
      )}

      {gameState === 'lobby' && (
        <Lobby
          name={userData.name}
          avatar={userData.avatar}
          onSelectMode={handleSelectMode}
        />
      )}

      {gameState === 'matchmaking' && (
        <Matchmaking
          mode={gameMode}
          onCancel={handleRestart}
          isConnected={isConnected}
        />
      )}

      {gameState === 'playing' && gameData && (
        <Game
          questions={gameData.questions}
          opponent={Object.values(gameData.players).find(p => p.name !== userData.name)}
          opponentScore={opponentScore}
          socket={getSocket()}
          roomId={gameData.roomId}
          playerId={playerIdRef.current}
          myName={userData.name}
          myCountry={Object.values(gameData.players).find(p => p.name === userData.name)?.country}
          onFinish={handleFinish}
          startTime={gameData.startTime}
          duration={gameData.duration || 90}
        />
      )}

      {gameState === 'results' && (
        <Results
          score={finalScore}
          opponentScore={opponentScore}
          opponentName={Object.values(gameData?.players || {}).find(p => p.name !== userData.name)?.name}
          onRestart={handleRestart}
        />
      )}
    </div>
  );
}

export default App;
