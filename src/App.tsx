import React, { FC, useState, useRef, useEffect } from "react";
import { DoodleJump } from "./DoodleJump";
import {
  addPayerToLeaderboard,
  getLeaderboard,
  Leader,
  trackGameFinish,
  trackGameRestart,
  trackSignGameFinish,
} from "./firebase";
import { CanvasDoodleRenderer } from "./CanvasDoodleRenderer";
import { PlayerModal } from "./components/PlayerModal";
import { Leaderboard } from "./components/Leaderboard";
import { Instructions } from "./components/Instructions";
import { GameContainer } from "./components/GameContainer";
import { useBlockGestures } from "./hooks/useBlockGestures";
import { useVisibilityChange } from "./hooks/useVisibilityChange";
import { useRemoveSelection } from "./hooks/useRemoveSelection";
import "./style.css";

const isTouch = "touchstart" in window || !!navigator.maxTouchPoints;

const defaultPlayer: Leader = {
  id: "",
  player: `doodler_${Math.floor(new Date().getTime() / 1000)}`,
  score: 0,
  date: new Date().toLocaleString(),
};

export const App: FC = () => {
  const doodleJumpRef = useRef<DoodleJump>();
  const doodleJumpRendererRef = useRef<CanvasDoodleRenderer>();
  const gameContainerRef = useRef<HTMLCanvasElement>(null);
  const isOverlay = useRef(false);

  const [showPlayerModal, setShowPlayerModal] = useState(false);
  const [score, setScore] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);
  const [leaders, setLeaders] = useState<Leader[]>([]);
  const [player, setPlayer] = useState<Leader>(defaultPlayer);
  const [isShownLeaderboard, setIsShownLeaderboard] = useState(false);
  const [isShownInstructions, setIsShownInstructions] = useState(isTouch);

  isOverlay.current = isShownLeaderboard || isShownInstructions;

  const restart = () => {
    const gameContainer = gameContainerRef.current;
    if (!gameContainer) return;

    doodleJumpRendererRef.current?.destroy();
    doodleJumpRendererRef.current = undefined;
    doodleJumpRendererRef.current = new CanvasDoodleRenderer(gameContainer);

    doodleJumpRef.current?.destroy();
    doodleJumpRef.current = undefined;
    doodleJumpRef.current = new DoodleJump({
      renderer: (data) => {
        doodleJumpRendererRef.current?.update(data);
        setScore(data.score);
        setIsGameOver(data.isGameOver);
      },
    });
    doodleJumpRef.current.start();
  };

  const handleRestart = () => {
    setIsShownLeaderboard(false);
    setIsShownInstructions(false);
    setPlayer(defaultPlayer);
    trackGameRestart();
    restart();
  };

  const onPlayerModalClose = async (playerName: string) => {
    setShowPlayerModal(false);

    if (score && playerName) {
      const playerId = await addPayerToLeaderboard(playerName, score);
      if (playerId) setPlayer((prev) => ({ ...prev, id: playerId }));
      trackSignGameFinish(score, playerName);
      await getLeaderboard().then(setLeaders);
    }
  };

  useEffect(() => {
    const endGame = async () => {
      trackGameFinish(score);
      setIsShownLeaderboard(true);

      await new Promise((resolve) => setTimeout(resolve, 500));

      if (score) setShowPlayerModal(true);
      doodleJumpRef.current?.destroy();
    };

    if (isGameOver) endGame();
    // disable exhaustive-deps to avoid accidentally call endGame() twice
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isGameOver]);

  useEffect(() => {
    restart();
    getLeaderboard().then(setLeaders);
  }, []);

  useRemoveSelection(!isOverlay.current);
  useVisibilityChange((visible) =>
    visible ? doodleJumpRef.current?.play() : doodleJumpRef.current?.pause()
  );
  useBlockGestures();

  return (
    <GameContainer>
      <Instructions open={isShownInstructions} onClose={handleRestart} />

      <header>
        <h1>Double Jump Game</h1>
        <h3>Score: {score}</h3>
      </header>

      <canvas ref={gameContainerRef} className="game-container" />

      <Leaderboard
        open={isShownLeaderboard}
        active={!isShownInstructions && !showPlayerModal}
        player={player}
        leaders={leaders}
        onClose={handleRestart}
      />

      <footer>
        <strong className="help">
          <div>
            <span>{isTouch ? "Swipe" : "Arrows"} &nbsp;</span>
            <div>
              <div>← → &thinsp;&thinsp; Move</div>
            </div>
          </div>
        </strong>
      </footer>

      <PlayerModal
        open={showPlayerModal}
        score={score}
        defaultName={defaultPlayer.player}
        onClose={onPlayerModalClose}
      />
    </GameContainer>
  );
};
