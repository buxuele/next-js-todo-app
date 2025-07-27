"use client";

import { useState, useEffect } from "react";
import styles from "./KeyboardShortcuts.module.css";

export default function KeyboardShortcuts() {
  const [isVisible, setIsVisible] = useState(false);

  // Show/hide shortcuts help with '?' key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "?" && !e.ctrlKey && !e.metaKey && !e.altKey) {
        const activeElement = document.activeElement;
        // Only show help if no input is focused
        if (
          !activeElement ||
          (activeElement.tagName !== "INPUT" &&
            activeElement.tagName !== "TEXTAREA")
        ) {
          e.preventDefault();
          setIsVisible((prev) => !prev);
        }
      } else if (e.key === "Escape" && isVisible) {
        e.preventDefault();
        setIsVisible(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isVisible]);

  if (!isVisible) {
    return (
      <div className={styles.helpTrigger}>
        <button
          onClick={() => setIsVisible(true)}
          className={styles.helpButton}
          title="Show keyboard shortcuts (Press ? for help)"
        >
          ⌨️
        </button>
      </div>
    );
  }

  return (
    <div className={styles.overlay} onClick={() => setIsVisible(false)}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h3>Keyboard Shortcuts</h3>
          <button
            onClick={() => setIsVisible(false)}
            className={styles.closeButton}
          >
            ✕
          </button>
        </div>

        <div className={styles.content}>
          <div className={styles.section}>
            <h4>Global Shortcuts</h4>
            <div className={styles.shortcut}>
              <kbd>?</kbd>
              <span>Show/hide this help</span>
            </div>
            <div className={styles.shortcut}>
              <kbd>n</kbd>
              <span>Focus new todo input</span>
            </div>
            <div className={styles.shortcut}>
              <kbd>Ctrl</kbd> + <kbd>n</kbd>
              <span>Focus new todo input</span>
            </div>
            <div className={styles.shortcut}>
              <kbd>Ctrl</kbd> + <kbd>f</kbd>
              <span>Focus search (in search mode)</span>
            </div>
          </div>

          <div className={styles.section}>
            <h4>New Todo Input</h4>
            <div className={styles.shortcut}>
              <kbd>Enter</kbd>
              <span>Add new todo</span>
            </div>
            <div className={styles.shortcut}>
              <kbd>Shift</kbd> + <kbd>Enter</kbd>
              <span>New line</span>
            </div>
            <div className={styles.shortcut}>
              <kbd>Escape</kbd>
              <span>Clear input and unfocus</span>
            </div>
          </div>

          <div className={styles.section}>
            <h4>Todo Item Editing</h4>
            <div className={styles.shortcut}>
              <kbd>Click</kbd>
              <span>Start editing</span>
            </div>
            <div className={styles.shortcut}>
              <kbd>Double-click</kbd>
              <span>Toggle completion</span>
            </div>
            <div className={styles.shortcut}>
              <kbd>Enter</kbd>
              <span>Save changes</span>
            </div>
            <div className={styles.shortcut}>
              <kbd>Shift</kbd> + <kbd>Enter</kbd>
              <span>New line in todo</span>
            </div>
            <div className={styles.shortcut}>
              <kbd>Escape</kbd>
              <span>Cancel editing</span>
            </div>
            <div className={styles.shortcut}>
              <kbd>Tab</kbd>
              <span>Indent text</span>
            </div>
          </div>

          <div className={styles.section}>
            <h4>Search</h4>
            <div className={styles.shortcut}>
              <kbd>Escape</kbd>
              <span>Clear search</span>
            </div>
          </div>
        </div>

        <div className={styles.footer}>
          <p>
            Press <kbd>Escape</kbd> or click outside to close
          </p>
        </div>
      </div>
    </div>
  );
}
