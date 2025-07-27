"use client";

import { useState } from "react";
import styles from "./ExportButton.module.css";

interface ExportButtonProps {
  date: string;
  disabled?: boolean;
}

export default function ExportButton({
  date,
  disabled = false,
}: ExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [exportStatus, setExportStatus] = useState<
    "idle" | "success" | "error"
  >("idle");

  const handleExport = async () => {
    if (disabled || isExporting) return;

    try {
      setIsExporting(true);
      setExportStatus("idle");

      const response = await fetch(`/api/todos/export/${date}`);

      if (!response.ok) {
        throw new Error("Export failed");
      }

      // Get the filename from the response headers
      const contentDisposition = response.headers.get("content-disposition");
      const filename = contentDisposition
        ? contentDisposition.split("filename=")[1]?.replace(/"/g, "")
        : `todos-${date}.md`;

      // Create blob and download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();

      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      setExportStatus("success");
      setTimeout(() => setExportStatus("idle"), 3000);
    } catch (error) {
      console.error("Export failed:", error);
      setExportStatus("error");
      setTimeout(() => setExportStatus("idle"), 3000);
    } finally {
      setIsExporting(false);
    }
  };

  const getButtonText = () => {
    if (isExporting) return "Exporting...";
    if (exportStatus === "success") return "Exported!";
    if (exportStatus === "error") return "Export Failed";
    return "Export as Markdown";
  };

  const getButtonIcon = () => {
    if (isExporting) return "⏳";
    if (exportStatus === "success") return "✅";
    if (exportStatus === "error") return "❌";
    return "📄";
  };

  return (
    <button
      onClick={handleExport}
      disabled={disabled || isExporting}
      className={`${styles.exportButton} ${
        exportStatus === "success" ? styles.success : ""
      } ${exportStatus === "error" ? styles.error : ""}`}
      title="Export todos as markdown file"
    >
      <span className={styles.icon}>{getButtonIcon()}</span>
      <span className={styles.text}>{getButtonText()}</span>
    </button>
  );
}
