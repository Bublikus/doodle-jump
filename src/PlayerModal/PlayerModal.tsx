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
    function focusAndOpenKeyboard(
      el: HTMLInputElement | null,
      timeout?: number
    ) {
      if (!timeout) {
        timeout = 500;
      }
      if (el) {
        // Align temp input element approximately where the input element is
        // so the cursor doesn't jump around
        var __tempEl__ = document.createElement("input");
        __tempEl__.style.position = "absolute";
        __tempEl__.style.top = el.offsetTop + 7 + "px";
        __tempEl__.style.left = el.offsetLeft + "px";
        __tempEl__.style.height = 0 + "px";
        __tempEl__.style.opacity = 0 + "px";
        // Put this temp element as a child of the page <body> and focus on it
        document.body.appendChild(__tempEl__);
        __tempEl__.focus();
        __tempEl__.select();

        // The keyboard is open. Now do a delayed focus on the target element
        setTimeout(function () {
          el.focus();
          el.click();
          el.select();
          // Remove the temp element
          document.body.removeChild(__tempEl__);
        }, timeout);
      }
    }

    focusAndOpenKeyboard(inputRef.current);
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
        <div className="player-modal__form-section">
          <h2 className="player-modal__score-title">🚀Score</h2>
          <h3 className="player-modal__score">{score}</h3>
        </div>

        <div className="player-modal__form-section">
          <h2 className="player-modal__name-title">👤Enter your name:</h2>
          <input
            ref={inputRef}
            type="text"
            id="firstName"
            name="firstName"
            autoFocus
            autoComplete="firstName"
            value={name}
            className="player-modal__input"
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <footer className="player-modal__footer">
          <button type="submit" className="player-modal__footer-button">
            Save
          </button>
        </footer>
      </form>
    </Modal>
  );
};
