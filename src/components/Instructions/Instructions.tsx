import React from "react";
import swipeImg from "./swipe-horizontal.png";
import tapImg from "./tap.png";
import "./styles.css";

interface LeaderboardProps {
  open: boolean;
  onClose(): void;
}

export const Instructions: React.FC<LeaderboardProps> = ({ open, onClose }) => {
  return !open ? null : (
    <div role="button" className="instruction" onClick={onClose}>
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
  );
};
