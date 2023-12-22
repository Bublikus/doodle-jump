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
import { PlayerModal } from "./PlayerModal";
import bgImg from "./assets/bg.jpg";
import swipeImg from "./assets/swipe-horizontal.png";
import tapImg from "./assets/tap.png";
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
  const [loading, setLoading] = useState(true);
  const [score, setScore] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);
  const [leaders, setLeaders] = useState<Leader[]>([]);
  const [player, setPlayer] = useState<Leader>(defaultPlayer);
  const [isShownLeaderboard, setIsShownLeaderboard] = useState(false);
  const [isShownInstructions, setIsShownInstructions] = useState(isTouch);

  isOverlay.current = isShownLeaderboard || isShownInstructions;

  const sortedLeaders = leaders.sort((a, b) => b.score - a.score).slice(0, 10);

  const restart = () => {
    const gameContainer = gameContainerRef.current;
    if (!gameContainer) return;

    doodleJumpRendererRef.current =
      doodleJumpRendererRef.current || new CanvasDoodleRenderer(gameContainer);

    doodleJumpRef.current =
      doodleJumpRef.current ||
      new DoodleJump({
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
      if (playerId) {
        setPlayer((prev) => ({ ...prev, id: playerId }));
      }
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
  }, [isGameOver]);

  useEffect(() => {
    if (!loading && !isShownInstructions) restart();
  }, [loading]);

  useEffect(() => {
    getLeaderboard().then(setLeaders);
  }, []);

  useEffect(() => {
    const checkSelectionInterval = setInterval(() => {
      if (isOverlay.current) return;
      window.getSelection()?.removeAllRanges?.();
    }, 20);

    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        doodleJumpRef.current?.pause();
      }
    });

    const blockGestures = (e: Event) => {
      e.preventDefault();
      (document.body.style as any).zoom = 1;
    };

    document.addEventListener("gesturestart", blockGestures);
    document.addEventListener("gesturechange", blockGestures);
    document.addEventListener("gestureend", blockGestures);

    return () => {
      document.removeEventListener("gesturestart", blockGestures);
      document.removeEventListener("gesturechange", blockGestures);
      document.removeEventListener("gestureend", blockGestures);

      clearInterval(checkSelectionInterval);
    };
  }, []);

  const getPrize = (i: number) => {
    if (i === 0) {
      return "🥇";
    } else if (i === 1) {
      return "🥈";
    } else if (i === 2) {
      return "🥉";
    } else {
      return "";
    }
  };

  return (
    <>
      {loading && <p className="loading">loading...</p>}
      <main className={loading ? "loading" : ""}>
        <img
          className="bg"
          src={bgImg}
          alt="bg"
          onLoad={() => setLoading(false)}
        />

        {isShownInstructions && (
          <div role="button" className="instruction" onClick={handleRestart}>
            <h2>How to play</h2>

            <div className="instruction__images">
              <div className="instruction__image">
                <span className="instruction__image-title">
                  Swipe{"\n"}to{"\n"}move
                </span>
                <img src={swipeImg} alt="swipe" />
              </div>
              <div className="instruction__image">
                <span className="instruction__image-title">
                  Tap{"\n"}to{"\n"}pause
                </span>
                <img src={tapImg} alt="tap" />
              </div>
            </div>

            <h2>Tap to start</h2>
          </div>
        )}

        <header>
          <h1>Double Jump Game</h1>
          <h3>Score: 🚀{score}</h3>
        </header>

        <canvas ref={gameContainerRef} className="game-container" />

        {isShownLeaderboard && (
          <div role="button" className="leaderboard" onClick={handleRestart}>
            <div className="leaderboard-box">
              <h3>Leaderboard</h3>
              <table>
                <thead>
                  <tr>
                    <th>Rank</th>
                    <th>Player</th>
                    <th>Score</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedLeaders.map((leader, i) => (
                    <tr
                      key={leader.id}
                      className={leader.id === player.id ? "strong" : ""}
                    >
                      <td>
                        <span>{leader.id === player.id ? "→ " : ""}</span>
                        <span>{i + 1}</span>
                        <span>
                          {getPrize(i) || <span className="invisible">🥉</span>}
                        </span>
                      </td>
                      <td>{leader.player.slice(0, 20).padEnd(20, ".")}</td>
                      <td>{leader.score}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <footer>
          <strong className="help">
            <div>
              <span>{isTouch ? "Swipe" : "Arrows"} &nbsp;</span>
              <div>
                <div>← → &thinsp;&thinsp; Move</div>
              </div>
            </div>
            <div>
              <span>{isTouch ? "Tap" : "Space"} &nbsp;</span>
              <div>
                <div>- Pause</div>
              </div>
            </div>
          </strong>
        </footer>
      </main>

      <PlayerModal
        open={showPlayerModal}
        score={score}
        defaultName={defaultPlayer.player}
        onClose={onPlayerModalClose}
      />
    </>
  );
};
