"use client";

import styles from "./ErrorMessage.module.css";

interface ErrorMessageProps {
  error: string | Error;
  onRetry?: () => void;
  onDismiss?: () => void;
  variant?: "inline" | "banner" | "modal";
  className?: string;
}

export default function ErrorMessage({
  error,
  onRetry,
  onDismiss,
  variant = "inline",
  className = "",
}: ErrorMessageProps) {
  const errorMessage = typeof error === "string" ? error : error.message;

  return (
    <div className={`${styles.errorMessage} ${styles[variant]} ${className}`}>
      <div className={styles.errorContent}>
        <div className={styles.errorIcon}>
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>

        <div className={styles.errorText}>
          <strong>Error:</strong> {errorMessage}
        </div>

        <div className={styles.errorActions}>
          {onRetry && (
            <button
              onClick={onRetry}
              className={styles.retryButton}
              title="Retry the operation"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
              >
                <polyline points="23 4 23 10 17 10" />
                <polyline points="1 20 1 14 7 14" />
                <path d="m3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
              </svg>
              Retry
            </button>
          )}

          {onDismiss && (
            <button
              onClick={onDismiss}
              className={styles.dismissButton}
              title="Dismiss this error"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
