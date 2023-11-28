import React, { FC, useState, useRef, useEffect } from "react";
import { DoubleJump } from "./DoubleJump";
import {
  addPayerToLeaderboard,
  getLeaderboard,
  Leader,
  trackTetrisGameFinish,
  trackTetrisGameRestart,
  trackTetrisSignGameFinish,
} from "./firebase";
import bgImg from "./bg.jpg";
import swipeImg from "./swipe-all-directions.png";
import tapImg from "./tap.png";
import "./style.css";

const isTouch = "touchstart" in window || !!navigator.maxTouchPoints;

let isInstance = false;

export const App: FC = () => {
  const tetrisRef = useRef<DoubleJump>();
  const isOverlayRef = useRef(false);

  const defaultName = useRef(localStorage.getItem("playerName"));

  const [loading, setLoading] = useState(true);
  const [gameArea, setGameArea] = useState<any>();
  const [leaders, setLeaders] = useState<Leader[]>([]);
  const [ownId, setOwnId] = useState("");
  const [isShownLeaderboard, setIsShownLeaderboard] = useState(false);
  const [isShownInstructions, setIsShownInstructions] = useState(isTouch);

  isOverlayRef.current = isShownLeaderboard || isShownInstructions;

  const sortedLeaders = leaders.sort((a, b) => b.spots - a.spots).slice(0, 10);

  const restart = () => {
    if (!isInstance) {
      isInstance = true;
      tetrisRef.current = undefined;
      tetrisRef.current = new DoubleJump({ renderer: setGameArea });
      tetrisRef.current.start();
    }
  };

  const handleRestart = () => {
    setIsShownLeaderboard(false);
    setOwnId("");
    trackTetrisGameRestart();
    restart();
    setIsShownInstructions(false);
    tetrisRef.current?.play();
  };

  useEffect(() => {
    const endGame = async () => {
      setIsShownLeaderboard(true);

      await new Promise((resolve) => setTimeout(resolve, 500));

      if (tetrisRef.current?.spots) {
        trackTetrisGameFinish(tetrisRef.current?.spots || 0);

        const promptPlayer = () => {
          let playerName;

          while (true) {
            const player = prompt(
              `Spots: 🚀${tetrisRef.current?.spots}\n👤Enter your name: `,
              defaultName.current ?? undefined
            );

            playerName = player?.trim().slice(0, 50);

            if (playerName !== null && playerName !== "") break;
          }

          return playerName;
        };

        const playerName = promptPlayer();

        if (playerName) {
          const playerId = await addPayerToLeaderboard(
            playerName,
            tetrisRef.current?.spots || 0
          );

          localStorage.setItem("playerName", playerName);
          defaultName.current = playerName;

          if (playerId) setOwnId(playerId);

          trackTetrisSignGameFinish(tetrisRef.current?.spots || 0, playerName);

          await getLeaderboard().then(setLeaders);
        }
      }

      isInstance = false;
      tetrisRef.current?.destroy();
    };

    if (tetrisRef.current?.isEndGame) endGame();
  }, [tetrisRef.current?.isEndGame]);

  useEffect(() => {
    if (!loading && !isShownInstructions) restart();
  }, [loading]);

  useEffect(() => {
    getLeaderboard().then(setLeaders);

    if (isShownInstructions) {
      restart();
      tetrisRef.current?.pause();
    }
  }, []);

  useEffect(() => {
    const checkSelectionInterval = setInterval(
      () => window.getSelection()?.removeAllRanges?.(),
      20
    );

    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        tetrisRef.current?.pause();
      } else if (!isOverlayRef.current) {
        tetrisRef.current?.play();
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
          <h3>Spots: 🚀{tetrisRef.current?.spots || 0}</h3>
        </header>

        <section className="grid">Double Jump</section>

        {isShownLeaderboard && (
          <div role="button" className="leaderboard" onClick={handleRestart}>
            <div className="leaderboard-box">
              <h3>Leaderboard</h3>
              <table>
                <thead>
                  <tr>
                    <th>Rank</th>
                    <th>Player</th>
                    <th>Spots</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedLeaders.map((leader, i) => (
                    <tr
                      key={leader.id}
                      className={leader.id === ownId ? "strong" : ""}
                    >
                      <td>
                        <span>{leader.id === ownId ? "→ " : ""}</span>
                        <span>{i + 1}</span>
                        <span>
                          {getPrize(i) || <span className="invisible">🥉</span>}
                        </span>
                      </td>
                      <td>{leader.player.slice(0, 20).padEnd(20, ".")}</td>
                      <td>🚀{leader.spots}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <footer>
          <strong className="help">
            <span>{isTouch ? "Swipe" : "Arrows"} &nbsp;</span>
            <div>
              <div>
                &nbsp;&nbsp;&thinsp;&thinsp;↑ &nbsp;&nbsp;&nbsp;&nbsp; - Rotate
              </div>
              <div>← → &thinsp;&thinsp;- Move</div>
              <div>
                &nbsp;&nbsp;&thinsp;&thinsp;↓ &nbsp;&nbsp;&nbsp;&nbsp; - Speed
                up
              </div>
            </div>
          </strong>
        </footer>
      </main>
    </>
  );
};
