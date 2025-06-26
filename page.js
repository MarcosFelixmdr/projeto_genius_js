'use client';
import { useState, useEffect } from 'react';

const COLORS = ['green', 'red', 'yellow', 'blue'];
const colorStyles = {
  green: { background: '#43a047', borderTopLeftRadius: '100% 100%' }, //Um quadrado com bordas arredondadas 
  red: { background: '#e53935', borderTopRightRadius: '100% 100%' },
  yellow: { background: '#fbc02d', borderBottomLeftRadius: '100% 100%' },
  blue: { background: '#1e88e5', borderBottomRightRadius: '100% 100%' },
};

export default function GeniusGame() {
  const [step, setStep] = useState('setup'); //Controla o estágio atual do jogo setup = tela de configuração
  const [names, setNames] = useState(['']); // Guarda os nomes digitados no formulário inicial. Array com os nomes (ex: ['João', 'Maria', '']).
  const [players, setPlayers] = useState([]); // Armazena os jogadores válidos (após o clique em "Iniciar").
  const [currentPlayer, setCurrentPlayer] = useState(0); // Quem deve jogar no momento
  const [sequence, setSequence] = useState([]); // Guarda a sequência de cores que o jogador deve repetir.
  const [userStep, setUserStep] = useState(0); // Cor que o jogador está tentando repetir na sequência.
  const [isUserTurn, setIsUserTurn] = useState(false); // true se é a vez do jogador clicar. false se o jogo está mostrando a sequência.
  const [awaitingNextSequence, setAwaitingNextSequence] = useState(false); // Usado para evitar mostrar a sequência novamente enquanto o sistema ainda está processando transições entre turnos.
  const [activeColor, setActiveColor] = useState(''); // Cor que está sendo destacada no momento (piscar durante a sequência).
  const [userClickColor, setUserClickColor] = useState(''); // Cor que o jogador acabou de clicar (para efeito visual rápido de clique). Limpa após 200ms com useEffect.
  const [message, setMessage] = useState(''); // Mostra mensagens de feedback: "Sua vez", "Errou", "Vencedor", etc.
  const [score, setScore] = useState([]); // Guarda os pontos de cada jogador.
  const [eliminated, setEliminated] = useState([]); // Array de true ou false indicando se o jogador foi eliminado.
  const [speed, setSpeed] = useState(500); // Controla a velocidade de exibição da sequência (em milissegundos). Dificuldade
  const [mode, setMode] = useState('single'); // Modo de jogo: 'single' para 1 jogador ou 'multi' para multiplayer.

  useEffect(() => { // Esse efeito é executado sempre que algum dos valores no array de dependências mudar.  Ele roda quando: A sequência muda, É a vez do jogador ou não, O jogo está em andamento ou não, A velocidade muda, Ou está aguardando uma nova sequência.
    if (step !== 'playing' || isUserTurn || sequence.length === 0 || awaitingNextSequence) return; // Isso garante que a sequência só será mostrada automaticamente pelo jogo em momentos apropriados.
    let i = 0; // Inicia a contagem da posição da sequência (i).
    setMessage('Memorize a sequência!'); // Mostra a mensagem para o jogador: “Memorize a sequência!”.
    const interval = setInterval(() => {
      setActiveColor(sequence[i]); // // Ativa a cor
      setTimeout(() => setActiveColor(''), speed * 0.6); // Desativa a cor após o tempo especificado
      i++;
      if (i >= sequence.length) {
        clearInterval(interval); // Limpa quando termina a sequência
        setTimeout(() => {
          setIsUserTurn(true); // Libera o turno do jogador
          setMessage(`Sua vez: ${players[currentPlayer]?.name || ''}`);
        }, speed * 0.7); // // Pequeno delay antes da vez do jogador
      }
    }, speed);
    return () => clearInterval(interval); // Garante que o intervalo seja limpo se o efeito for interrompido antes de terminar.
  }, [sequence, isUserTurn, step, players, currentPlayer, speed, awaitingNextSequence]);

  useEffect(() => {
    if (userClickColor) { // Este trecho é um hook do React que executa um efeito colateral (side effect) sempre que a variável userClickColor muda.
      const t = setTimeout(() => setUserClickColor(''), 200); // Mostra um efeito visual em 200ms para mostrar o clique do jogador
      return () => clearTimeout(t); // Este retorno é uma função de limpeza do useEffect.
    }
  }, [userClickColor]);

  function getNextPlayer(current, elimList) { // Current: jogador atual. elimList: array de booleanos indicando se um jogador foi eliminado ou não.
    let next = current; // Próximo ativo
    const total = elimList.length; // Pega o número total de jogadores.
    for (let i = 0; i < total; i++) { // Vai repetir no máximo uma vez por jogador, para encontrar o próximo jogador ainda não eliminado.
      next = (next + 1) % total; // Avança para o próximo jogador circularmente.
      if (!elimList[next]) return next; // Se elimList[next] === false (ou seja, não eliminado), então retorna esse índice.
    }
    return current; // Se não encontrou nenhum jogador ativo, encerra.
  }

  function handleColorClick(color) { //Essa função é chamada quando o usuário clica em uma cor (botão ou célula).
    if (!isUserTurn || eliminated[currentPlayer]) return; //Verifica se não é a vez do jogador atual. Se for falso, impede qualquer clique. Verifica se o jogador atual está eliminado. Se foi, também não pode clicar em nada.
    setUserClickColor(color); //Atualiza o estado userClickColor com a cor clicada. Usado para dar feedback visual (como um "brilho" ou animação). 
    if (color === sequence[userStep]) {  // verifica se o clique 
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
          setStep('finished'); // fim de jogo
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
        <h1 style={{ color: '#fff' }}>GENIUS</h1>
        <div style={{ marginBottom: 10 }}>
          <label style={{ color: '#fff' }}>Modo:&nbsp;
            <select value={mode} onChange={e => setMode(e.target.value)}>
              <option value="single">Single Player</option>
              <option value="multi">Multiplayer</option>
            </select>
          </label>
        </div>
        {[0, 1, 2, 3].map(i => (
          <input key={i} type="text" placeholder={`Jogador ${i + 1}`} value={names[i] || ''} onChange={e => {
            const newNames = [...names];
            newNames[i] = e.target.value;
            setNames(newNames);
          }} style={{ margin: 4, padding: 8, borderRadius: 4, border: '1px solid #888' }} />
        ))}
        <button onClick={startGame} style={{ marginTop: 16, padding: '10px 30px', fontSize: 18, borderRadius: 8, border: 'none', background: '#333', color: '#fff', cursor: 'pointer' }}>
          Iniciar
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
