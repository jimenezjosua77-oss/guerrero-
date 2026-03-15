/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Keyboard, Trophy, Zap, RefreshCw, Play, Pause, AlertCircle, Flame, Timer, Heart, Globe, ArrowLeft, LogIn, LogOut, Coins, Star, Info, LayoutDashboard, Users, Target, Activity, ArrowUp, Mountain, Rocket, Ghost, Crown, ShoppingBag, Check } from 'lucide-react';
import { auth, db, googleProvider, signInWithPopup, signOut, onAuthStateChanged, doc, getDoc, setDoc, updateDoc, onSnapshot, serverTimestamp, User, collection, query, orderBy, limit, getDocs } from './firebase';

// --- Constants ---
const WORDS = {
  en: [
    'react', 'typescript', 'javascript', 'tailwind', 'vite', 'motion', 'google', 'studio',
    'keyboard', 'challenge', 'speed', 'accuracy', 'dynamic', 'performance', 'interface',
    'component', 'function', 'variable', 'constant', 'asynchronous', 'promise', 'callback',
    'rendering', 'virtual', 'document', 'element', 'attribute', 'property', 'state', 'effect',
    'context', 'reducer', 'memoization', 'optimization', 'deployment', 'production', 'development',
    'debugging', 'testing', 'framework', 'library', 'package', 'module', 'import', 'export',
    'algorithm', 'database', 'frontend', 'backend', 'fullstack', 'middleware', 'authentication',
    'authorization', 'encryption', 'decryption', 'network', 'protocol', 'serverless', 'container',
    'microservices', 'architecture', 'scalability', 'reliability', 'availability', 'latency'
  ],
  es: [
    'teclado', 'desafio', 'velocidad', 'precision', 'dinamico', 'interfaz', 'componente', 'funcion', 
    'variable', 'constante', 'asincrono', 'promesa', 'renderizado', 'virtual', 'documento', 'elemento', 
    'atributo', 'propiedad', 'estado', 'efecto', 'contexto', 'optimizacion', 'despliegue', 'produccion', 
    'desarrollo', 'depuracion', 'prueba', 'biblioteca', 'paquete', 'modulo', 'importar', 'exportar', 
    'fuego', 'llamas', 'calor', 'rapido', 'escritura', 'juego', 'victoria', 'derrota', 'mision', 
    'ignicion', 'motor', 'maestro', 'desarrollador', 'codigo', 'programa', 'pantalla',
    'algoritmo', 'base', 'datos', 'red', 'protocolo', 'servidor', 'contenedor', 'nube',
    'seguridad', 'encriptacion', 'autenticacion', 'autorizacion', 'arquitectura', 'escalabilidad'
  ]
};

const LOGOS = [
  { id: 'zap', icon: Zap, name: 'Default' },
  { id: 'flame', icon: Flame, name: 'Fire' },
  { id: 'star', icon: Star, name: 'Star' },
  { id: 'heart', icon: Heart, name: 'Heart' },
  { id: 'trophy', icon: Trophy, name: 'Trophy' },
  { id: 'target', icon: Target, name: 'Target' },
  { id: 'activity', icon: Activity, name: 'Pulse' },
  { id: 'rocket', icon: Rocket, name: 'Rocket' },
  { id: 'ghost', icon: Ghost, name: 'Ghost' },
  { id: 'crown', icon: Crown, name: 'Crown' },
];

const LOGO_COST = 100;

const I18N = {
  en: {
    title: "Keyboard Jump",
    subtitle: "Type to jump higher. Reach level 50.",
    livesText: "You have 3 lives.",
    start: "START CLIMB",
    retry: "RETRY CLIMB",
    playAgain: "PLAY AGAIN",
    back: "BACK TO MENU",
    gameOver: "Fallen",
    gameOverDesc: "You missed the platform.",
    victory: "Summit Reached",
    victoryDesc: "You are the ultimate climber.",
    score: "Height",
    best: "Max Height",
    phase: "Level",
    time: "Time",
    placeholder: "TYPE TO JUMP...",
    idlePlaceholder: "READY TO CLIMB",
    fall: "Fall",
    multiplier: "Multiplier",
    combo: "COMBO",
    lang: "Language",
    login: "Sign in with Google",
    logout: "Sign Out",
    rewards: "Coins",
    nextLevel: "Next Level",
    levelComplete: "Level Complete!",
    accuracy: "Accuracy",
    wpm: "WPM",
    leaderboard: "Leaderboard",
    howToPlay: "How To Play",
    tutorial: "Type the word on the platform to jump to it. Each 50 points you climb a level. Don't let the time run out!",
    totalWords: "Total Words",
    bestWpm: "Best WPM",
    shop: "Logo Shop",
    buy: "Buy",
    select: "Select",
    selected: "Selected",
    insufficient: "Not enough coins!"
  },
  es: {
    title: "Keyboard Jump",
    subtitle: "Escribe para saltar más alto. Llega al nivel 50.",
    gold: "Oro",
    livesText: "Tienes 3 vidas.",
    start: "INICIAR ESCALADA",
    retry: "REINTENTAR",
    playAgain: "JUGAR DE NUEVO",
    back: "VOLVER AL MENÚ",
    gameOver: "Caída",
    gameOverDesc: "Perdiste la plataforma.",
    victory: "Cima Alcanzada",
    victoryDesc: "Eres el escalador definitivo.",
    score: "Altura",
    best: "Altura Máx",
    phase: "Nivel",
    time: "Tiempo",
    placeholder: "ESCRIBE PARA SALTAR...",
    idlePlaceholder: "LISTO PARA ESCALAR",
    fall: "Caída",
    multiplier: "Multiplicador",
    combo: "COMBO",
    lang: "Idioma",
    login: "Iniciar sesión con Google",
    logout: "Cerrar Sesión",
    rewards: "Monedas",
    nextLevel: "Siguiente Nivel",
    levelComplete: "¡Nivel Completado!",
    accuracy: "Precisión",
    wpm: "PPM",
    leaderboard: "Clasificación",
    howToPlay: "Cómo Jugar",
    tutorial: "Escribe la palabra en la plataforma para saltar hacia ella. Cada 50 puntos subes un nivel. ¡No dejes que se agote el tiempo!",
    totalWords: "Palabras Totales",
    bestWpm: "Mejor PPM",
    shop: "Tienda de Logos",
    buy: "Comprar",
    select: "Seleccionar",
    selected: "Seleccionado",
    insufficient: "¡Monedas insuficientes!"
  }
};

// Generate 50 levels
const getLevelConfig = (level: number) => {
  // Base speed starts at 0.2 and increases by 0.025 per level
  const speed = 0.2 + (level - 1) * 0.025;
  // Duration starts at 15s and increases slightly
  const duration = 15 + Math.floor(level / 5) * 2;
  return { speed, duration };
};

interface WordInstance {
  id: string;
  text: string;
  x: number;
  y: number;
  speed: number;
}

interface UserProgress {
  uid: string;
  highScore: number;
  currentLevel: number;
  rewards: number;
  totalWords: number;
  bestWpm: number;
  averageAccuracy: number;
  displayName: string;
  photoURL: string;
  ownedLogos: string[];
  selectedLogo: string;
}

interface LeaderboardEntry {
  uid: string;
  displayName: string;
  photoURL: string;
  highScore: number;
  bestWpm: number;
}

export default function App() {
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'gameover' | 'victory' | 'level_complete'>('idle');
  const [language, setLanguage] = useState<'en' | 'es'>('es');
  const [score, setScore] = useState(0);
  const [user, setUser] = useState<User | null>(null);
  const [progress, setProgress] = useState<UserProgress>({
    uid: '',
    highScore: 0,
    currentLevel: 1,
    rewards: 0,
    totalWords: 0,
    bestWpm: 0,
    averageAccuracy: 0,
    displayName: '',
    photoURL: '',
    ownedLogos: ['zap'],
    selectedLogo: 'zap'
  });
  
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showHowToPlay, setShowHowToPlay] = useState(false);
  const [showShop, setShowShop] = useState(false);
  const [shopError, setShopError] = useState('');
  const [isError, setIsError] = useState(false);
  const [totalKeystrokes, setTotalKeystrokes] = useState(0);
  const [correctKeystrokes, setCorrectKeystrokes] = useState(0);
  const [sessionWpm, setSessionWpm] = useState(0);
  const [sessionAccuracy, setSessionAccuracy] = useState(100);
  const [startTime, setStartTime] = useState(0);
  
  const [words, setWords] = useState<WordInstance[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [level, setLevel] = useState(1);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [lives, setLives] = useState(3);
  const [multiplier, setMultiplier] = useState(1);
  const [combo, setCombo] = useState(0);

  const gameContainerRef = useRef<HTMLDivElement>(null);
  const requestRef = useRef<number>(null);
  const lastTick = useRef<number>(0);

  const t = I18N[language];

  // --- Firebase Sync ---

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const userDoc = doc(db, 'users', currentUser.uid);
        const unsubDoc = onSnapshot(userDoc, (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            setProgress({
              ...data,
              ownedLogos: data.ownedLogos || ['zap'],
              selectedLogo: data.selectedLogo || 'zap'
            } as UserProgress);
          } else {
            const initialProgress: UserProgress = {
              uid: currentUser.uid,
              highScore: 0,
              currentLevel: 1,
              rewards: 0,
              totalWords: 0,
              bestWpm: 0,
              averageAccuracy: 0,
              displayName: currentUser.displayName || 'Player',
              photoURL: currentUser.photoURL || '',
              ownedLogos: ['zap'],
              selectedLogo: 'zap'
            };
            setDoc(userDoc, initialProgress);
            setProgress(initialProgress);
          }
        });
        return () => unsubDoc();
      } else {
        setProgress({ 
          uid: '', highScore: 0, currentLevel: 1, rewards: 0, 
          totalWords: 0, bestWpm: 0, averageAccuracy: 0, displayName: '', photoURL: '',
          ownedLogos: ['zap'], selectedLogo: 'zap'
        });
      }
    });
    return () => unsubscribe();
  }, []);

  const fetchLeaderboard = async () => {
    const q = query(collection(db, 'users'), orderBy('highScore', 'desc'), limit(10));
    const querySnapshot = await getDocs(q);
    const entries: LeaderboardEntry[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      entries.push({
        uid: doc.id,
        displayName: data.displayName || 'Anonymous',
        photoURL: data.photoURL || '',
        highScore: data.highScore || 0,
        bestWpm: data.bestWpm || 0
      });
    });
    setLeaderboard(entries);
  };

  useEffect(() => {
    if (showLeaderboard) fetchLeaderboard();
  }, [showLeaderboard]);

  const saveProgress = async (newScore: number, newLevel: number, newRewards: number) => {
    // Update local state first so it reflects in the UI immediately
    setProgress(prev => ({
      ...prev,
      highScore: Math.max(prev.highScore, newScore),
      currentLevel: Math.max(prev.currentLevel, newLevel),
      rewards: prev.rewards + newRewards,
      totalWords: prev.totalWords + Math.floor(score / 10),
      bestWpm: Math.max(prev.bestWpm, sessionWpm),
      averageAccuracy: prev.averageAccuracy === 0 ? sessionAccuracy : (prev.averageAccuracy + sessionAccuracy) / 2,
    }));

    if (!user) return;

    const userDoc = doc(db, 'users', user.uid);
    try {
      await updateDoc(userDoc, {
        highScore: Math.max(progress.highScore, newScore),
        currentLevel: Math.max(progress.currentLevel, newLevel),
        rewards: progress.rewards + newRewards,
        totalWords: progress.totalWords + Math.floor(score / 10),
        bestWpm: Math.max(progress.bestWpm, sessionWpm),
        averageAccuracy: progress.averageAccuracy === 0 ? sessionAccuracy : (progress.averageAccuracy + sessionAccuracy) / 2,
        lastUpdated: serverTimestamp()
      });
    } catch (e) {
      console.error("Error updating progress", e);
    }
  };

  const handleBuyLogo = async (logoId: string) => {
    if (progress.rewards < LOGO_COST) {
      setShopError(t.insufficient);
      setTimeout(() => setShopError(''), 2000);
      return;
    }

    const newOwnedLogos = [...progress.ownedLogos, logoId];
    const newRewards = progress.rewards - LOGO_COST;

    setProgress(prev => ({
      ...prev,
      rewards: newRewards,
      ownedLogos: newOwnedLogos
    }));

    if (user) {
      const userDoc = doc(db, 'users', user.uid);
      await updateDoc(userDoc, {
        rewards: newRewards,
        ownedLogos: newOwnedLogos
      });
    }
  };

  const handleSelectLogo = async (logoId: string) => {
    setProgress(prev => ({
      ...prev,
      selectedLogo: logoId
    }));

    if (user) {
      const userDoc = doc(db, 'users', user.uid);
      await updateDoc(userDoc, {
        selectedLogo: logoId
      });
    }
  };

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Login failed", error);
    }
  };

  const SelectedLogoIcon = LOGOS.find(l => l.id === progress.selectedLogo)?.icon || Zap;

  const handleLogout = async () => {
    await signOut(auth);
  };

  // --- Game Logic ---

  const spawnWord = useCallback(() => {
    const wordList = WORDS[language];
    const text = wordList[Math.floor(Math.random() * wordList.length)];
    const id = Math.random().toString(36).substr(2, 9);
    const x = Math.random() * 60 + 20; // Keep away from edges
    
    const config = getLevelConfig(level);
    const newWord: WordInstance = {
      id,
      text,
      x,
      y: 10, // Start at the top (new platform appearing)
      speed: config.speed
    };
    
    setWords([newWord]);
  }, [level, language]);

  const updateGame = useCallback((time: number) => {
    if (gameState !== 'playing') return;

    if (time - lastTick.current >= 1000) {
      setTimeElapsed(prev => prev + 1);
      
      // Update WPM
      const elapsedMinutes = (performance.now() - startTime) / 60000;
      if (elapsedMinutes > 0) {
        const currentWpm = Math.round((correctKeystrokes / 5) / elapsedMinutes);
        setSessionWpm(currentWpm);
      }
      
      lastTick.current = time;
    }

    if (words.length === 0) {
      spawnWord();
    }

    setWords(prev => {
      if (prev.length === 0) return prev;
      // Platforms move DOWN as the player "jumps" up
      const updated = prev.map(w => ({ ...w, y: w.y + w.speed }));
      const hitBottom = updated.some(w => w.y > 85);
      if (hitBottom) {
        setLives(l => {
          const newLives = l - 1;
          if (newLives <= 0) {
            setGameState('gameover');
            saveProgress(score, level, 0);
          }
          return newLives;
        });
        return [];
      }
      return updated;
    });

    requestRef.current = requestAnimationFrame(updateGame);
  }, [gameState, level, spawnWord, words.length, score, startTime, correctKeystrokes, sessionWpm]);

  useEffect(() => {
    if (gameState === 'playing') {
      requestRef.current = requestAnimationFrame(updateGame);
    } else {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    }
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [gameState, updateGame]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toLowerCase();
    const lastChar = value.slice(-1);
    
    setTotalKeystrokes(prev => prev + 1);
    
    // Check if the character matches the current word's next character
    const targetWord = words[0];
    if (targetWord) {
      if (targetWord.text.startsWith(value)) {
        setCorrectKeystrokes(prev => prev + 1);
        setIsError(false);
      } else {
        setIsError(true);
        setTimeout(() => setIsError(false), 200);
      }
    }

    setInputValue(value);

    const matchedWord = words.find(w => w.text === value);
    if (matchedWord) {
      setWords([]);
      setInputValue('');
      const points = matchedWord.text.length * multiplier;
      const newScore = score + points;
      
      // Check for level up (every 50 points)
      const currentThreshold = Math.floor(score / 50);
      const nextThreshold = Math.floor(newScore / 50);
      
      setScore(newScore);
      setCombo(prev => prev + 1);
      
      if (combo > 0 && combo % 5 === 0) {
        setMultiplier(prev => Math.min(prev + 1, 5));
      }

      if (nextThreshold > currentThreshold) {
        if (level < 50) {
          setGameState('level_complete');
          saveProgress(newScore, level + 1, 10);
        } else {
          setGameState('victory');
          saveProgress(newScore, level, 50);
        }
      }
    }

    // Update Accuracy
    if (totalKeystrokes > 0) {
      setSessionAccuracy(Math.round((correctKeystrokes / totalKeystrokes) * 100));
    }
  };

  const startGame = () => {
    setGameState('playing');
    setScore(0);
    setLevel(progress.currentLevel || 1);
    setTimeElapsed(0);
    setLives(3);
    setWords([]);
    setInputValue('');
    setMultiplier(1);
    setCombo(0);
    setTotalKeystrokes(0);
    setCorrectKeystrokes(0);
    setSessionWpm(0);
    setSessionAccuracy(100);
    setStartTime(performance.now());
    lastTick.current = performance.now();
  };

  const nextLevel = () => {
    const nextLvl = level + 1;
    setLevel(nextLvl);
    setGameState('playing');
    setWords([]);
    setInputValue('');
    lastTick.current = performance.now();
    saveProgress(score, nextLvl, 10); // 10 rewards per level
  };

  const backToMenu = () => {
    setGameState('idle');
    setWords([]);
    setInputValue('');
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-orange-500/30 overflow-hidden flex flex-col">
      {/* Header / Stats */}
      <header className="p-4 flex justify-between items-center border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-md z-20">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-500 rounded-lg shadow-lg shadow-blue-500/20">
            <ArrowUp className="w-5 h-5 text-zinc-950 animate-bounce" />
          </div>
          <div className="hidden sm:block">
            <h1 className="text-lg font-bold tracking-tight uppercase italic text-blue-500 leading-none">Keyboard Jump</h1>
            {user && <span className="text-[10px] text-zinc-500 font-mono">{user.displayName || user.email}</span>}
          </div>
        </div>

        <div className="flex gap-4 md:gap-8 items-center">
          <div className="flex flex-col items-center">
            <span className="text-[9px] uppercase tracking-widest text-zinc-500 font-mono">Lives</span>
            <div className="flex gap-1">
              {[...Array(3)].map((_, i) => (
                <Heart 
                  key={i} 
                  className={`w-3 h-3 md:w-4 md:h-4 ${i < lives ? 'text-red-500 fill-red-500' : 'text-zinc-800'}`} 
                />
              ))}
            </div>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-[9px] uppercase tracking-widest text-zinc-500 font-mono">{t.phase}</span>
            <span className="text-lg md:text-xl font-bold font-mono text-orange-400">{level}/50</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-[9px] uppercase tracking-widest text-zinc-500 font-mono">{t.wpm}</span>
            <span className="text-lg md:text-xl font-bold font-mono text-blue-400">{sessionWpm}</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-[9px] uppercase tracking-widest text-zinc-500 font-mono">{t.accuracy}</span>
            <span className="text-lg md:text-xl font-bold font-mono text-purple-400">{sessionAccuracy}%</span>
          </div>
          <div className="hidden lg:flex flex-col items-center">
            <span className="text-[9px] uppercase tracking-widest text-zinc-500 font-mono">{t.rewards}</span>
            <div className="flex items-center gap-1">
              <Coins className="w-3 h-3 text-yellow-500" />
              <span className="text-xl font-bold font-mono text-yellow-500">{progress.rewards}</span>
            </div>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-[9px] uppercase tracking-widest text-zinc-500 font-mono">{t.time}</span>
            <span className="text-lg md:text-xl font-bold font-mono text-zinc-300">{timeElapsed}s</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-[9px] uppercase tracking-widest text-zinc-500 font-mono">{t.score}</span>
            <span className="text-lg md:text-xl font-bold font-mono text-emerald-400">{score.toString().padStart(6, '0')}</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {user ? (
            <button onClick={handleLogout} className="p-2 hover:bg-zinc-800 rounded-full transition-colors text-zinc-500 hover:text-red-400" title={t.logout}>
              <LogOut className="w-5 h-5" />
            </button>
          ) : (
            <button onClick={handleLogin} className="flex items-center gap-2 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-xs font-bold transition-all border border-zinc-700">
              <LogIn className="w-4 h-4" />
              {t.login}
            </button>
          )}
        </div>
      </header>

      {/* Main Game Area */}
      <main 
        ref={gameContainerRef}
        className={`flex-1 relative overflow-hidden bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-950/20 via-zinc-950 to-black transition-all duration-200 ${isError ? 'translate-x-2 bg-red-950/20' : ''}`}
      >
        {/* Background Grid */}
        <div className="absolute inset-0 opacity-5 pointer-events-none" 
             style={{ backgroundImage: 'linear-gradient(#3b82f6 1px, transparent 1px), linear-gradient(90deg, #3b82f6 1px, transparent 1px)', backgroundSize: '60px 60px' }} />

        {/* Words (Platforms) */}
        <AnimatePresence>
          {words.map((word) => (
            <motion.div
              key={word.id}
              initial={{ opacity: 0, scale: 0.5, y: -20 }}
              animate={{ opacity: 1, scale: 1, top: `${word.y}%`, left: `${word.x}%` }}
              exit={{ opacity: 0, scale: 1.5, y: -100, filter: 'blur(15px)', transition: { duration: 0.3 } }}
              className="absolute -translate-x-1/2 flex flex-col items-center"
            >
              <div className="px-6 py-2 rounded-lg border-b-4 border-blue-600 bg-zinc-800 shadow-[0_10px_20px_rgba(59,130,246,0.3)] relative min-w-[120px] text-center">
                <span className="text-xl font-mono font-black tracking-widest text-blue-400 uppercase">
                  {word.text}
                </span>
                <div className="absolute -bottom-1 left-0 right-0 h-1 bg-blue-400 opacity-50 rounded-full" />
              </div>
              {/* Platform Support */}
              <div className="w-full h-4 bg-gradient-to-b from-zinc-800 to-transparent opacity-50" />
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Player Character (Visual only) */}
        {gameState === 'playing' && (
          <motion.div 
            animate={{ y: [0, -10, 0] }}
            transition={{ repeat: Infinity, duration: 0.5 }}
            className="absolute bottom-20 left-1/2 -translate-x-1/2 z-10"
          >
            <div className="p-3 bg-blue-500 rounded-full shadow-[0_0_20px_rgba(59,130,246,0.5)]">
              <SelectedLogoIcon className="w-6 h-6 text-zinc-950 fill-current" />
            </div>
          </motion.div>
        )}

        {/* Overlays */}
        {gameState === 'idle' && (
          <div className="absolute inset-0 flex items-center justify-center bg-zinc-950/90 backdrop-blur-md z-30">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center max-w-lg p-10 rounded-3xl border border-blue-500/20 bg-zinc-900 shadow-[0_0_100px_rgba(59,130,246,0.1)]"
            >
              <div className="relative inline-block mb-8">
                <Mountain className="w-24 h-24 text-blue-500 mx-auto animate-bounce" />
                <div className="absolute inset-0 bg-blue-500 blur-3xl opacity-20 animate-pulse" />
              </div>
              <h2 className="text-5xl font-black uppercase italic mb-6 tracking-tighter">
                Keyboard<span className="text-blue-500">Jump</span>
              </h2>
              <div className="space-y-4 text-zinc-400 mb-10 text-lg">
                <p>{t.subtitle}</p>
                <div className="flex justify-center gap-4 md:gap-8 overflow-x-auto py-2">
                  <div className="flex flex-col items-center min-w-[60px]">
                    <LayoutDashboard className="w-4 h-4 text-blue-500 mb-1" />
                    <span className="text-[10px] uppercase text-zinc-500">{t.phase}</span>
                    <span className="text-xl font-bold text-blue-400">{progress.currentLevel}/50</span>
                  </div>
                  <div className="flex flex-col items-center min-w-[60px]">
                    <Coins className="w-4 h-4 text-yellow-500 mb-1" />
                    <span className="text-[10px] uppercase text-zinc-500">{t.rewards}</span>
                    <span className="text-xl font-bold text-yellow-500">{progress.rewards}</span>
                  </div>
                  <div className="flex flex-col items-center min-w-[60px]">
                    <Trophy className="w-4 h-4 text-emerald-500 mb-1" />
                    <span className="text-[10px] uppercase text-zinc-500">{t.best}</span>
                    <span className="text-xl font-bold text-emerald-400">{progress.highScore}</span>
                  </div>
                  <div className="flex flex-col items-center min-w-[60px]">
                    <Activity className="w-4 h-4 text-blue-400 mb-1" />
                    <span className="text-[10px] uppercase text-zinc-500">{t.bestWpm}</span>
                    <span className="text-xl font-bold text-blue-400">{progress.bestWpm}</span>
                  </div>
                </div>
                
                <div className="flex flex-wrap justify-center gap-3 mt-4">
                  <button 
                    onClick={() => setShowLeaderboard(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-xl text-xs font-bold transition-all border border-zinc-700"
                  >
                    <Users className="w-4 h-4 text-blue-400" />
                    {t.leaderboard}
                  </button>
                  <button 
                    onClick={() => setShowShop(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-xl text-xs font-bold transition-all border border-zinc-700"
                  >
                    <ShoppingBag className="w-4 h-4 text-yellow-500" />
                    {t.shop}
                  </button>
                  <button 
                    onClick={() => setShowHowToPlay(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-xl text-xs font-bold transition-all border border-zinc-700"
                  >
                    <Info className="w-4 h-4 text-blue-400" />
                    {t.howToPlay}
                  </button>
                </div>

                {/* Language Selector */}
                <div className="flex items-center justify-center gap-4 mt-6">
                  <Globe className="w-5 h-5 text-zinc-500" />
                  <div className="flex bg-zinc-800 p-1 rounded-xl border border-zinc-700">
                    <button 
                      onClick={() => setLanguage('en')}
                      className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${language === 'en' ? 'bg-blue-500 text-zinc-950' : 'text-zinc-400 hover:text-zinc-200'}`}
                    >
                      ENGLISH
                    </button>
                    <button 
                      onClick={() => setLanguage('es')}
                      className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${language === 'es' ? 'bg-blue-500 text-zinc-950' : 'text-zinc-400 hover:text-zinc-200'}`}
                    >
                      ESPAÑOL
                    </button>
                  </div>
                </div>
              </div>
              <button 
                onClick={startGame}
                className="w-full py-5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black rounded-2xl transition-all shadow-[0_10px_30px_rgba(37,99,235,0.3)] flex items-center justify-center gap-3 group text-xl"
              >
                <Play className="w-6 h-6 fill-current" />
                {t.start}
              </button>
              {!user && (
                <p className="mt-4 text-xs text-zinc-500 italic">Sign in to save your progress across 50 levels!</p>
              )}
            </motion.div>
          </div>
        )}

        {gameState === 'gameover' && (
          <div className="absolute inset-0 flex items-center justify-center bg-blue-950/60 backdrop-blur-xl z-30">
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-center max-w-md p-12 rounded-3xl border border-blue-500/40 bg-zinc-900 shadow-[0_0_80px_rgba(59,130,246,0.3)]"
            >
              <AlertCircle className="w-24 h-24 text-red-500 mx-auto mb-8 animate-pulse" />
              <h2 className="text-6xl font-black uppercase italic mb-4 text-blue-500 tracking-tighter">{t.gameOver}</h2>
              <p className="text-zinc-400 mb-10 text-lg">{t.gameOverDesc}</p>
              
              <div className="grid grid-cols-2 gap-6 mb-10">
                <div className="p-5 rounded-2xl bg-zinc-800/50 border border-zinc-700">
                  <span className="text-[10px] uppercase tracking-widest text-zinc-500 block mb-2">{t.score}</span>
                  <span className="text-4xl font-bold font-mono text-blue-400">{score}</span>
                </div>
                <div className="p-5 rounded-2xl bg-zinc-800/50 border border-zinc-700">
                  <span className="text-[10px] uppercase tracking-widest text-zinc-500 block mb-2">{t.phase}</span>
                  <span className="text-4xl font-bold font-mono">{level}</span>
                </div>
              </div>

              <div className="flex flex-col gap-4">
                <button 
                  onClick={startGame}
                  className="w-full py-5 bg-white hover:bg-zinc-100 text-zinc-950 font-black rounded-2xl transition-all flex items-center justify-center gap-3 text-xl"
                >
                  <RefreshCw className="w-6 h-6" />
                  {t.retry}
                </button>
                <button 
                  onClick={backToMenu}
                  className="w-full py-4 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold rounded-2xl transition-all flex items-center justify-center gap-3 border border-zinc-700"
                >
                  <ArrowLeft className="w-5 h-5" />
                  {t.back}
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {gameState === 'level_complete' && (
          <div className="absolute inset-0 flex items-center justify-center bg-emerald-950/60 backdrop-blur-xl z-30">
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-center max-w-md p-12 rounded-3xl border border-emerald-500/40 bg-zinc-900 shadow-[0_0_80px_rgba(16,185,129,0.3)]"
            >
              <Star className="w-24 h-24 text-yellow-500 mx-auto mb-8 animate-bounce fill-yellow-500" />
              <h2 className="text-5xl font-black uppercase italic mb-4 text-emerald-500 tracking-tighter">{t.levelComplete}</h2>
              <p className="text-zinc-400 mb-10 text-lg">Level {level} cleared!</p>
              
              <div className="grid grid-cols-2 gap-6 mb-10">
                <div className="p-5 rounded-2xl bg-zinc-800/50 border border-zinc-700">
                  <span className="text-[10px] uppercase tracking-widest text-zinc-500 block mb-2">Reward</span>
                  <div className="flex items-center justify-center gap-2">
                    <Coins className="w-5 h-5 text-yellow-500" />
                    <span className="text-3xl font-bold font-mono text-yellow-500">+10</span>
                  </div>
                </div>
                <div className="p-5 rounded-2xl bg-zinc-800/50 border border-zinc-700">
                  <span className="text-[10px] uppercase tracking-widest text-zinc-500 block mb-2">{t.score}</span>
                  <span className="text-3xl font-bold font-mono text-emerald-400">{score}</span>
                </div>
              </div>

              <button 
                onClick={nextLevel}
                className="w-full py-5 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black rounded-2xl transition-all flex items-center justify-center gap-3 text-xl shadow-lg shadow-emerald-500/20"
              >
                <Zap className="w-6 h-6 fill-current" />
                {t.nextLevel}
              </button>
            </motion.div>
          </div>
        )}

        {gameState === 'victory' && (
          <div className="absolute inset-0 flex items-center justify-center bg-emerald-950/60 backdrop-blur-xl z-30">
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-center max-w-md p-12 rounded-3xl border border-emerald-500/40 bg-zinc-900 shadow-[0_0_80px_rgba(16,185,129,0.3)]"
            >
              <Trophy className="w-24 h-24 text-emerald-500 mx-auto mb-8 animate-bounce" />
              <h2 className="text-6xl font-black uppercase italic mb-4 text-emerald-500 tracking-tighter">{t.victory}</h2>
              <p className="text-zinc-400 mb-10 text-lg">{t.victoryDesc}</p>
              
              <div className="p-6 rounded-2xl bg-zinc-800/50 border border-zinc-700 mb-10">
                <span className="text-[10px] uppercase tracking-widest text-zinc-500 block mb-2">{t.score}</span>
                <span className="text-5xl font-bold font-mono text-emerald-400">{score}</span>
              </div>

              <div className="flex flex-col gap-4">
                <button 
                  onClick={startGame}
                  className="w-full py-5 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black rounded-2xl transition-all flex items-center justify-center gap-3 text-xl"
                >
                  <RefreshCw className="w-6 h-6" />
                  {t.playAgain}
                </button>
                <button 
                  onClick={backToMenu}
                  className="w-full py-4 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold rounded-2xl transition-all flex items-center justify-center gap-3 border border-zinc-700"
                >
                  <ArrowLeft className="w-5 h-5" />
                  {t.back}
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Shop Modal */}
        <AnimatePresence>
          {showShop && (
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 flex items-center justify-center bg-zinc-950/95 backdrop-blur-xl z-50 p-4"
            >
              <motion.div 
                initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
                className="w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl"
              >
                <div className="p-6 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/50">
                  <div className="flex items-center gap-3">
                    <ShoppingBag className="w-6 h-6 text-yellow-500" />
                    <h3 className="text-xl font-black uppercase italic tracking-tight">{t.shop}</h3>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1 bg-zinc-800 px-3 py-1 rounded-full border border-zinc-700">
                      <Coins className="w-4 h-4 text-yellow-500" />
                      <span className="text-sm font-bold font-mono text-yellow-500">{progress.rewards}</span>
                    </div>
                    <button onClick={() => setShowShop(false)} className="p-2 hover:bg-zinc-800 rounded-full transition-colors">
                      <ArrowLeft className="w-5 h-5" />
                    </button>
                  </div>
                </div>
                
                <div className="p-6">
                  {shopError && (
                    <motion.div initial={{ y: -10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-center text-sm font-bold">
                      {shopError}
                    </motion.div>
                  )}
                  
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 max-h-[50vh] overflow-y-auto p-2">
                    {LOGOS.map((logo) => {
                      const isOwned = progress.ownedLogos.includes(logo.id);
                      const isSelected = progress.selectedLogo === logo.id;
                      const Icon = logo.icon;
                      
                      return (
                        <div key={logo.id} className={`p-4 rounded-2xl border transition-all flex flex-col items-center gap-3 ${isSelected ? 'bg-blue-500/10 border-blue-500' : 'bg-zinc-800/50 border-zinc-700'}`}>
                          <div className={`p-3 rounded-full ${isSelected ? 'bg-blue-500 text-zinc-950' : 'bg-zinc-700 text-zinc-300'}`}>
                            <Icon className="w-6 h-6" />
                          </div>
                          <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">{logo.name}</span>
                          
                          {isOwned ? (
                            <button 
                              onClick={() => handleSelectLogo(logo.id)}
                              disabled={isSelected}
                              className={`w-full py-2 rounded-lg text-[10px] font-black uppercase transition-all ${isSelected ? 'bg-blue-500/20 text-blue-400 cursor-default' : 'bg-zinc-700 hover:bg-zinc-600 text-zinc-100'}`}
                            >
                              {isSelected ? t.selected : t.select}
                            </button>
                          ) : (
                            <button 
                              onClick={() => handleBuyLogo(logo.id)}
                              className="w-full py-2 bg-yellow-600 hover:bg-yellow-500 text-zinc-950 rounded-lg text-[10px] font-black uppercase transition-all flex items-center justify-center gap-1"
                            >
                              <Coins className="w-3 h-3" />
                              {LOGO_COST}
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
        <AnimatePresence>
          {showLeaderboard && (
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 flex items-center justify-center bg-zinc-950/95 backdrop-blur-xl z-50 p-4"
            >
              <motion.div 
                initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
                className="w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl"
              >
                <div className="p-6 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/50">
                  <div className="flex items-center gap-3">
                    <Users className="w-6 h-6 text-blue-400" />
                    <h3 className="text-xl font-black uppercase italic tracking-tight">{t.leaderboard}</h3>
                  </div>
                  <button onClick={() => setShowLeaderboard(false)} className="p-2 hover:bg-zinc-800 rounded-full transition-colors">
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                </div>
                <div className="p-4 max-h-[60vh] overflow-y-auto space-y-2">
                  {leaderboard.map((entry, i) => (
                    <div key={entry.uid} className={`flex items-center justify-between p-4 rounded-2xl border ${entry.uid === user?.uid ? 'bg-blue-500/10 border-blue-500/30' : 'bg-zinc-800/50 border-zinc-700'}`}>
                      <div className="flex items-center gap-4">
                        <span className={`text-lg font-black font-mono w-6 ${i < 3 ? 'text-yellow-500' : 'text-zinc-500'}`}>{i + 1}</span>
                        <img src={entry.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${entry.uid}`} alt="" className="w-10 h-10 rounded-full bg-zinc-700 border border-zinc-600" />
                        <div>
                          <p className="font-bold text-sm truncate max-w-[150px]">{entry.displayName}</p>
                          <p className="text-[10px] text-zinc-500 font-mono">WPM: {entry.bestWpm}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-black font-mono text-emerald-400">{entry.highScore}</p>
                        <p className="text-[9px] uppercase text-zinc-500 tracking-widest">Score</p>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* How To Play Modal */}
        <AnimatePresence>
          {showHowToPlay && (
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 flex items-center justify-center bg-zinc-950/95 backdrop-blur-xl z-50 p-4"
            >
              <motion.div 
                initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
                className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl p-8"
              >
                <div className="text-center mb-8">
                  <ArrowUp className="w-16 h-16 text-blue-500 mx-auto mb-4" />
                  <h3 className="text-3xl font-black uppercase italic tracking-tight">{t.howToPlay}</h3>
                </div>
                <div className="space-y-6 text-zinc-400">
                  <div className="flex gap-4">
                    <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0">
                      <span className="text-blue-500 font-bold">1</span>
                    </div>
                    <p className="text-sm">{t.tutorial}</p>
                  </div>
                  <div className="flex gap-4">
                    <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center shrink-0">
                      <span className="text-indigo-500 font-bold">2</span>
                    </div>
                    <p className="text-sm">Usa el multiplicador de combo escribiendo palabras consecutivas sin fallar.</p>
                  </div>
                  <div className="flex gap-4">
                    <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                      <span className="text-emerald-500 font-bold">3</span>
                    </div>
                    <p className="text-sm">Inicia sesión para competir en la clasificación global y guardar tu progreso.</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowHowToPlay(false)}
                  className="w-full mt-10 py-4 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 font-bold rounded-2xl transition-all border border-zinc-700"
                >
                  {t.back}
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Combo Indicator */}
        {combo > 0 && gameState === 'playing' && (
          <motion.div key={multiplier} initial={{ scale: 1.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="absolute bottom-32 right-12 text-right pointer-events-none">
            <span className="text-sm font-mono text-zinc-500 uppercase tracking-widest">{t.multiplier}</span>
            <div className="text-7xl font-black italic text-orange-500">x{multiplier}</div>
            <div className="text-xs font-mono text-orange-400/50">{combo} {t.combo}</div>
          </motion.div>
        )}
      </main>

      {/* Input Area */}
      <footer className="p-8 bg-zinc-900 border-t border-zinc-800 z-20">
        <div className="max-w-2xl mx-auto relative">
          <input
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            disabled={gameState !== 'playing'}
            placeholder={gameState === 'playing' ? t.placeholder : t.idlePlaceholder}
            autoFocus
            className="w-full bg-zinc-950 border-2 border-zinc-800 focus:border-orange-500 rounded-2xl px-8 py-6 text-3xl font-mono text-center outline-none transition-all placeholder:text-zinc-800 disabled:opacity-50 uppercase tracking-widest"
          />
          <div className="absolute right-8 top-1/2 -translate-y-1/2 pointer-events-none">
            <div className={`w-4 h-4 rounded-full ${gameState === 'playing' ? 'bg-orange-500 animate-pulse shadow-[0_0_10px_#f97316]' : 'bg-zinc-800'}`} />
          </div>
        </div>
      </footer>
    </div>
  );
}
