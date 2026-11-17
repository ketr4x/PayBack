"use client";

import React, { useState, useRef } from "react";
import { Camera, Upload, Loader2, Sparkles, AlertCircle } from "lucide-react";
import { createWorker } from "tesseract.js";
import { parseReceiptText } from "@/lib/receiptParser";

interface ReceiptScannerProps {
  onScanComplete: (result: {
    storeName?: string;
    total?: number;
    tax?: number;
    tip?: number;
    items: { name: string; price: number; quantity: number }[];
    rawText: string;
    receiptImageBase64?: string;
  }) => void;
}

export default function ReceiptScanner({ onScanComplete }: ReceiptScannerProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressStatus, setProgressStatus] = useState<string>("");
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleProcessImage = async (file: File) => {
    setError(null);
    setIsProcessing(true);
    setProgressStatus("Reading receipt image...");
    setProgressPercent(10);

    const reader = new FileReader();
    reader.onload = async () => {
      const base64Image = reader.result as string;
      setPreviewImage(base64Image);

      try {
        setProgressStatus("Initializing on-device OCR engine...");
        setProgressPercent(25);

        const worker = await createWorker("eng", 1, {
          logger: (m) => {
            if (m.status === "recognizing text") {
              setProgressStatus(`Scanning receipt text...`);
              setProgressPercent(30 + Math.round((m.progress || 0) * 60));
            }
          },
        });

        setProgressStatus("Recognizing items & numbers...");
        const ret = await worker.recognize(base64Image);
        const text = ret.data.text;
        await worker.terminate();

        setProgressStatus("Structuring receipt items...");
        setProgressPercent(95);

        const parsed = parseReceiptText(text);

        onScanComplete({
          ...parsed,
          rawText: text,
          receiptImageBase64: base64Image,
        });

        setIsProcessing(false);
        setProgressStatus("");
        setProgressPercent(100);
      } catch (err: unknown) {
        console.error("OCR Error:", err);
        setError("Failed to scan receipt. You can manually enter items or try another clear photo.");
        setIsProcessing(false);
      }
    };

    reader.onerror = () => {
      setError("Failed to read image file.");
      setIsProcessing(false);
    };

    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleProcessImage(file);
    }
  };

  return (
    <div className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-5 h-5 text-indigo-400" />
        <h3 className="text-lg font-semibold text-white">Smart Receipt Scanner</h3>
      </div>
      <p className="text-sm text-slate-400 mb-6">
        Take a photo or upload a receipt. Our on-device scanner will detect individual items and prices automatically for 100% free with complete privacy.
      </p>

      {/* Inputs hidden */}
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />
      <input
        type="file"
        ref={cameraInputRef}
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
      />

      {isProcessing ? (
        <div className="flex flex-col items-center justify-center p-8 bg-slate-950/60 rounded-xl border border-indigo-500/30">
          <Loader2 className="w-10 h-10 text-indigo-400 animate-spin mb-4" />
          <p className="text-sm font-medium text-slate-200 mb-2">{progressStatus}</p>
          <div className="w-full max-w-xs bg-slate-800 rounded-full h-2 overflow-hidden">
            <div
              className="bg-gradient-to-r from-indigo-500 to-emerald-400 h-2 transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <span className="text-xs text-slate-500 mt-2">{progressPercent}%</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => cameraInputRef.current?.click()}
            className="flex items-center justify-center gap-3 p-4 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-medium transition shadow-lg shadow-indigo-600/20 active:scale-[0.98]"
          >
            <Camera className="w-5 h-5" />
            <span>Snap Photo (Camera)</span>
          </button>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center justify-center gap-3 p-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium transition border border-slate-700 active:scale-[0.98]"
          >
            <Upload className="w-5 h-5" />
            <span>Upload Image</span>
          </button>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 mt-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {previewImage && !isProcessing && (
        <div className="mt-4 flex items-center gap-3 p-2 bg-slate-800/40 rounded-xl border border-slate-800">
          <img
            src={previewImage}
            alt="Scanned receipt preview"
            className="w-12 h-12 object-cover rounded-lg border border-slate-700"
          />
          <div className="text-xs text-slate-400">
            Receipt loaded and parsed. You can edit line items below!
          </div>
        </div>
      )}
    </div>
  );
}
