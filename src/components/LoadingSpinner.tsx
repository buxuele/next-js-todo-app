"use client";

import styles from "./LoadingSpinner.module.css";

interface LoadingSpinnerProps {
  size?: "small" | "medium" | "large";
  color?: "primary" | "secondary" | "white";
  text?: string;
  className?: string;
}

export default function LoadingSpinner({
  size = "medium",
  color = "primary",
  text,
  className = "",
}: LoadingSpinnerProps) {
  return (
    <div className={`${styles.container} ${className}`}>
      <div
        className={`${styles.spinner} ${styles[size]} ${styles[color]}`}
        role="status"
        aria-label="Loading"
      >
        <div className={styles.bounce1}></div>
        <div className={styles.bounce2}></div>
        <div className={styles.bounce3}></div>
      </div>
      {text && <span className={styles.text}>{text}</span>}
    </div>
  );
}
