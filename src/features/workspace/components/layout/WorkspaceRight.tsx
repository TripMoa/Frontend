// src\features\workspace\components\layout\WorkspaceRight.tsx

import React, { useState } from "react";
import type { KeyboardEvent } from "react";
import "../../styles/right.css";
import "../../styles/modals.css";
import { useChecklist } from "../../hooks/useChecklist";

const WorkspaceRight: React.FC = () => {
  const { items, addItem, toggleItem, updateText, deleteItem } = useChecklist();
  const [input, setInput] = useState("");
  const [mapOpen, setMapOpen] = useState(false);

  const handleKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      addItem(input);
      setInput("");
    }
  };

  const handleAdd = () => {
    addItem(input);
    setInput("");
  };

  const closeMapBg = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.currentTarget === e.target) {
      setMapOpen(false);
    }
  };

  return (
    <>
      {/* 🔥 오른쪽 패널 */}
      <div className="ws-tools">
        <div
          className="map-view"
          onClick={() => {
            setMapOpen(true);
          }}
        >
          <i className="fa-solid fa-map"></i> GPS VIEW
        </div>

        <div className="cl-view">
          <div className="cl-list" id="cl-list">
            {items.map((it) => (
              <div
                key={it.id}
                className={`cl-item ${it.checked ? "checked" : ""}`}
              >
                <div
                  className="cl-check"
                  onClick={() => toggleItem(it.id)}
                ></div>

                <div
                  className="cl-text"
                  contentEditable
                  suppressContentEditableWarning
                  onBlur={(e) => updateText(it.id, e.currentTarget.innerText)}
                >
                  {it.text}
                </div>

                <button className="cl-del" onClick={() => deleteItem(it.id)}>
                  <i className="fa-solid fa-xmark"></i>
                </button>
              </div>
            ))}
          </div>

          <div className="cl-form">
            <input
              type="text"
              id="cl-input"
              placeholder="ADD ITEM_"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKey}
            />
            <button onClick={handleAdd}>ADD</button>
          </div>
        </div>
      </div>

      {/* MAP MODAL (원본 id/구조 그대로) */}
      <div
        id="map-modal"
        className={`modal-overlay ${mapOpen ? "active" : ""}`}
        onClick={closeMapBg}
      >
        <div className="modal-window map-window">
          <div className="modal-header">
            <span className="mh-title">&gt;&gt; SATELLITE VIEW</span>
            <button
              className="mh-close"
              onClick={() => {
                setMapOpen(false);
              }}
            >
              CLOSE [X]
            </button>
          </div>

          <div className="modal-body">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d209995.63223164965!2d135.36113824357596!3d34.67768560000001!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x6000e6553406e2e1%3A0xc55bc16ee46a2fe7!2sOsaka%2C%20Osaka%20Prefecture%2C%20Japan!5e0!3m2!1sen!2skr!4v1700000000000!5m2!1sen!2skr"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen={true}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="map"
            ></iframe>
          </div>
        </div>
      </div>
    </>
  );
};

export default WorkspaceRight;
