import React, { useEffect, useRef, useState } from "react";
import Modal from "react-responsive-modal";
import "react-responsive-modal/styles.css";
import "./styles.css";

interface PlayerModalProps {
  open: boolean;
  score: number;
  onClose(name: string): void;
}

export const PlayerModal: React.FC<PlayerModalProps> = ({
  open,
  score,
  onClose,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const defaultName = useRef(localStorage.getItem("playerName"));

  const [name, setName] = useState(defaultName.current || "");

  const handleSubmit: React.FormEventHandler = (e) => {
    e.preventDefault();

    if (!name.trim()) {
      inputRef.current?.focus();
      inputRef.current?.select();
      return;
    }

    const playerName = name.trim().slice(0, 50);
    localStorage.setItem("playerName", playerName);
    defaultName.current = playerName;

    onClose(playerName);
  };

  useEffect(() => {
    if (open) {
      setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 100);
    }
  }, [open]);

  return (
    <Modal
      open={open}
      onClose={() => onClose("")}
      center
      blockScroll
      closeOnEsc
      showCloseIcon
      focusTrapped
      closeOnOverlayClick={false}
    >
      <form onSubmit={handleSubmit} className="player-modal__form">
        <h2 className="player-modal__score">Score: 🚀${score}</h2>
        <h2 className="player-modal__name-title">👤Enter your name:</h2>

        <input
          ref={inputRef}
          type="text"
          id="firstName"
          name="firstName"
          autoComplete="firstName"
          value={name}
          className="player-modal__input"
          onChange={(e) => setName(e.target.value)}
        />

        <footer className="player-modal__footer">
          <button type="submit">Save</button>
        </footer>
      </form>
    </Modal>
  );
};
