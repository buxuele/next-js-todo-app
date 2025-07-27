"use client";

import {
  useEffect,
  useRef,
  forwardRef,
  TextareaHTMLAttributes,
  useCallback,
} from "react";

interface AutoResizeTextareaProps
  extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  minRows?: number;
  maxRows?: number;
}

const AutoResizeTextarea = forwardRef<
  HTMLTextAreaElement,
  AutoResizeTextareaProps
>(({ minRows = 1, maxRows = 10, style, ...props }, ref) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const combinedRef = ref || textareaRef;

  const adjustHeight = useCallback(() => {
    const textarea =
      typeof combinedRef === "function" ? null : combinedRef?.current;
    if (!textarea) return;

    // Reset height to auto to get the correct scrollHeight
    textarea.style.height = "auto";

    // Calculate the line height
    const computedStyle = window.getComputedStyle(textarea);
    const lineHeight = parseInt(computedStyle.lineHeight) || 20;

    // Calculate min and max heights
    const minHeight = lineHeight * minRows;
    const maxHeight = lineHeight * maxRows;

    // Set the height based on content, but within min/max bounds
    const scrollHeight = textarea.scrollHeight;
    const newHeight = Math.min(Math.max(scrollHeight, minHeight), maxHeight);

    textarea.style.height = `${newHeight}px`;

    // Show scrollbar if content exceeds maxHeight
    textarea.style.overflowY = scrollHeight > maxHeight ? "auto" : "hidden";
  }, [combinedRef, minRows, maxRows]);

  useEffect(() => {
    adjustHeight();
  }, [props.value, adjustHeight]);

  const handleInput = (e: React.FormEvent<HTMLTextAreaElement>) => {
    adjustHeight();
    props.onInput?.(e);
  };

  return (
    <textarea
      {...props}
      ref={combinedRef}
      onInput={handleInput}
      style={{
        resize: "none",
        overflow: "hidden",
        ...style,
      }}
    />
  );
});

AutoResizeTextarea.displayName = "AutoResizeTextarea";

export default AutoResizeTextarea;
