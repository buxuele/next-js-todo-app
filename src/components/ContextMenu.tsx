"use client";

import { useEffect, useRef } from "react";
import styles from "./ContextMenu.module.css";

export interface ContextMenuOption {
  id: string;
  label: string;
  icon?: string;
  onClick: () => void;
  disabled?: boolean;
  destructive?: boolean;
}

interface ContextMenuProps {
  isVisible: boolean;
  position: { x: number; y: number };
  options: ContextMenuOption[];
  onClose: () => void;
}

export default function ContextMenu({
  isVisible,
  position,
  options,
  onClose,
}: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    if (isVisible) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleEscape);

      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
        document.removeEventListener("keydown", handleEscape);
      };
    }
  }, [isVisible, onClose]);

  // Adjust position to keep menu within viewport
  const getAdjustedPosition = () => {
    if (!menuRef.current) return position;

    const menuRect = menuRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let { x, y } = position;

    // Adjust horizontal position
    if (x + menuRect.width > viewportWidth) {
      x = viewportWidth - menuRect.width - 10;
    }

    // Adjust vertical position
    if (y + menuRect.height > viewportHeight) {
      y = viewportHeight - menuRect.height - 10;
    }

    // Ensure minimum distance from edges
    x = Math.max(10, x);
    y = Math.max(10, y);

    return { x, y };
  };

  const handleOptionClick = (option: ContextMenuOption) => {
    if (!option.disabled) {
      option.onClick();
      onClose();
    }
  };

  if (!isVisible) return null;

  const adjustedPosition = getAdjustedPosition();

  return (
    <div
      ref={menuRef}
      className={styles.contextMenu}
      style={{
        left: adjustedPosition.x,
        top: adjustedPosition.y,
      }}
    >
      {options.map((option) => (
        <button
          key={option.id}
          className={`${styles.menuOption} ${
            option.disabled ? styles.disabled : ""
          } ${option.destructive ? styles.destructive : ""}`}
          onClick={() => handleOptionClick(option)}
          disabled={option.disabled}
        >
          {option.icon && (
            <span className={styles.optionIcon}>{option.icon}</span>
          )}
          <span className={styles.optionLabel}>{option.label}</span>
        </button>
      ))}
    </div>
  );
}
