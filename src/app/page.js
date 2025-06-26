'use client';
import { useState, useEffect } from 'react';

const COLORS = ['green', 'red', 'yellow', 'blue'];
const colorStyles = {
  green: { background: '#43a047', borderTopLeftRadius: '100% 100%' },
  red: { background: '#e53935', borderTopRightRadius: '100% 100%' },
  yellow: { background: '#fbc02d', borderBottomLeftRadius: '100% 100%' },
  blue: { background: '#1e88e5', borderBottomRightRadius: '100% 100%' },
};

export default function GeniusGame() {
  const [step, setStep] = useState('setup');
  const [names, setNames] = useState(['']);
  const [players, setPlayers] = useState([]);
  const [currentPlayer, setCurrentPlayer] = useState(0);
  const [sequence, setSequence] = useState([]);
  const [userStep, setUserStep] = useState(0);
  const [isUserTurn, setIsUserTurn] = useState(false);
  const [awaitingNextSequence, setAwaitingNextSequence] = useState(false);
  const [activeColor, setActiveColor] = useState('');
  const [userClickColor, setUserClickColor] = useState('');
  const [message, setMessage] = useState('');
  const [score, setScore] = useState([]);
  const [eliminated, setEliminated] = useState([]);
  const [speed, setSpeed] = useState(700);
  const [mode, setMode] = useState('single');

  useEffect(() => {
    if (step !== 'playing' || isUserTurn || sequence.length === 0 || awaitingNextSequence) return;
    let i = 0;
    setMessage('Memorize a sequência!');
    const interval = setInterval(() => {
      setActiveColor(sequence[i]);
      setTimeout(() => setActiveColor(''), speed * 0.6);
      i++;
      if (i >= sequence.length) {
        clearInterval(interval);
        setTimeout(() => {
          setIsUserTurn(true);
          setMessage(`Sua vez: ${players[currentPlayer]?.name || ''}`);
        }, speed * 0.7);
      }
    }, speed);
    return () => clearInterval(interval);
  }, [sequence, isUserTurn, step, players, currentPlayer, speed, awaitingNextSequence]);

  useEffect(() => {
    if (userClickColor) {
      const t = setTimeout(() => setUserClickColor(''), 200);
      return () => clearTimeout(t);
    }
  }, [userClickColor]);

  function getNextPlayer(current, elimList) {
    let next = current;
    const total = elimList.length;
    for (let i = 0; i < total; i++) {
      next = (next + 1) % total;
      if (!elimList[next]) return next;
    }
    return current;
  }

  function handleColorClick(color) {
    if (!isUserTurn || eliminated[currentPlayer]) return;
    setUserClickColor(color);
    if (color === sequence[userStep]) {
      if (userStep + 1 === sequence.length) {
        const newScore = [...score];
        newScore[currentPlayer]++;
        setScore(newScore);
        setIsUserTurn(false);
        setUserStep(0);
        setAwaitingNextSequence(true);

        setTimeout(() => {
          let next = currentPlayer;
          if (mode === 'multi') {
            next = getNextPlayer(currentPlayer, eliminated);
            setCurrentPlayer(next);
          }
          setTimeout(() => {
            setSequence(prev => [...prev, COLORS[Math.floor(Math.random() * 4)]]);
            setAwaitingNextSequence(false);
          }, 300);
        }, 500);
      } else {
        setUserStep(userStep + 1);
      }
    } else {
      if (mode === 'single') {
        setMessage(`Errou! Pontuação: ${score[0]}. Fim de jogo.`);
        setStep('finished');
      } else {
        const newElim = [...eliminated];
        newElim[currentPlayer] = true;
        setEliminated(newElim);
        setMessage(`${players[currentPlayer].name} foi eliminado!`);
        if (newElim.filter(e => !e).length === 1) {
          const winner = players.find((_, i) => !newElim[i]);
          setMessage(`Fim de jogo! Vencedor: ${winner.name}`);
          setStep('finished');
        } else {
          const next = getNextPlayer(currentPlayer, newElim);
          setCurrentPlayer(next);
          setUserStep(0);
          setTimeout(() => {
            setIsUserTurn(false);
            setSequence([...sequence]);
          }, 1000);
        }
      }
    }
  }

  function resetGame() {
    setStep('setup');
    setNames(['']);
    setPlayers([]);
    setScore([]);
    setEliminated([]);
    setCurrentPlayer(0);
    setSequence([]);
    setUserStep(0);
    setIsUserTurn(false);
    setMessage('');
    setSpeed(700);
  }

  function startGame() {
    const filtered = names.filter(n => n.trim());
    if (filtered.length === 0) return;
    setPlayers(filtered.map(name => ({ name })));
    setScore(filtered.map(() => 0));
    setEliminated(filtered.map(() => false));
    setCurrentPlayer(0);
    setSequence([COLORS[Math.floor(Math.random() * 4)]]);
    setUserStep(0);
    setIsUserTurn(false);
    setStep('playing');
    setMessage('');
  }

  if (step === 'setup') {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#222' }}>
        <h1 style={{ color: '#fff' }}>Genius Game</h1>
        <div style={{ marginBottom: 20 }}>
          <label style={{ color: '#fff' }}>Modo:&nbsp;
            <select value={mode} onChange={e => setMode(e.target.value)}>
              <option value="single">Single Player</option>
              <option value="multi">Multiplayer</option>
            </select>
          </label>
        </div>
        {[0, 1, 2, 3].map(i => (
          <input key={i} type="text" placeholder={`Nome do jogador ${i + 1}`} value={names[i] || ''} onChange={e => {
            const newNames = [...names];
            newNames[i] = e.target.value;
            setNames(newNames);
          }} style={{ margin: 4, padding: 8, borderRadius: 4, border: '1px solid #888' }} />
        ))}
        <button onClick={startGame} style={{ marginTop: 16, padding: '10px 30px', fontSize: 18, borderRadius: 8, border: 'none', background: '#333', color: '#fff', cursor: 'pointer' }}>
          Iniciar Jogo
        </button>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#222' }}>
      <h1 style={{ color: '#fff', marginBottom: 10 }}>Genius Game</h1>
      <div style={{ width: 320, height: 320, display: 'grid', gridTemplate: '1fr 1fr / 1fr 1fr', borderRadius: 40, background: 'radial-gradient(circle, #444 60%, #111 100%)', boxShadow: '0 0 40px #000a', marginBottom: 20 }}>
        {COLORS.map((color) => (
          <button key={color} onClick={() => handleColorClick(color)}
            style={{
              ...colorStyles[color],
              opacity: (activeColor === color || userClickColor === color) ? 1 : 0.7,
              border: 'none',
              outline: 'none',
              margin: 8,
              cursor: isUserTurn && !eliminated[currentPlayer] ? 'pointer' : 'default',
              transition: 'opacity 0.2s',
              width: '140px',
              height: '140px',
              fontSize: 0,
              boxShadow: (activeColor === color || userClickColor === color) ? '0 0 20px #fff8' : 'none'
            }}
            aria-label={color}
            disabled={eliminated[currentPlayer]}
          />
        ))}
      </div>
      <div style={{ color: '#fff', marginBottom: 10 }}>{message}</div>
      <div style={{ color: '#fff', marginBottom: 10 }}>
        {players.map((p, i) => (
          <span key={i} style={{
            marginRight: 12,
            textDecoration: eliminated[i] ? 'line-through' : 'none',
            color: currentPlayer === i ? '#fbc02d' : '#fff'
          }}>
            {p.name}: {score[i]}
          </span>
        ))}
      </div>
      {step === 'finished' && (
        <button onClick={resetGame} style={{ padding: '10px 30px', fontSize: 18, borderRadius: 8, border: 'none', background: '#333', color: '#fff', cursor: 'pointer' }}>
          Jogar novamente
        </button>
      )}
    </div>
  );
}
