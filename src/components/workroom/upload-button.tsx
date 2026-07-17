"use client";

import { CloudUpload } from "lucide-react";
import { useRef, useState } from "react";

export function UploadButton({ onUpload }: { onUpload: (file: File) => Promise<void> }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<"idle" | "uploading" | "done" | "error">("idle");
  async function handleFile(file: File | undefined) {
    if (!file) return;
    setStatus("uploading");
    try { await onUpload(file); setStatus("done"); } catch { setStatus("error"); }
  }
  const labels = { idle: "계획서 업로드", uploading: "암호화 업로드 중", done: "파이프라인 생성됨", error: "업로드 다시 시도" };
  return (
    <>
      <button className="upload-button" type="button" onClick={() => inputRef.current?.click()} disabled={status === "uploading"}>
        <CloudUpload size={18} />{labels[status]}
      </button>
      <input ref={inputRef} className="visually-hidden" type="file" accept=".pdf,.docx,.txt,.md" onChange={(event) => void handleFile(event.target.files?.[0])} />
      <span className="visually-hidden" aria-live="polite">{labels[status]}</span>
    </>
  );
}
