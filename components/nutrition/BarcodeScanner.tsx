"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { BrowserMultiFormatReader, type Result } from "@zxing/browser"
import { X, ScanLine } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils/cn"

interface BarcodeScannerProps {
  onScan: (barcode: string) => void
  onClose: () => void
  className?: string
}

export function BarcodeScanner({ onScan, onClose, className }: BarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isScanning, setIsScanning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastScanned, setLastScanned] = useState<string | null>(null)
  const readerRef = useRef<BrowserMultiFormatReader | null>(null)

  const stopScanning = useCallback(() => {
    if (readerRef.current) {
      readerRef.current.reset()
      readerRef.current = null
    }
    setIsScanning(false)
  }, [])

  const startScanning = useCallback(async () => {
    if (!videoRef.current) return

    try {
      setIsScanning(true)
      setError(null)

      const codeReader = new BrowserMultiFormatReader()
      readerRef.current = codeReader

      // Start decoding from video device
      const result = await codeReader.decodeFromVideoDevice(
        undefined, // Use default camera
        videoRef.current,
        (result: Result | undefined, err) => {
          if (result) {
            const barcode = result.getText()
            
            // Debounce: Only accept same barcode after 2 seconds
            if (barcode !== lastScanned) {
              setLastScanned(barcode)
              onScan(barcode)
              
              // Reset after delay to allow re-scan
              setTimeout(() => setLastScanned(null), 2000)
            }
          }
        }
      )
    } catch (err) {
      console.error("Scanner error:", err)
      setError("Kamera-Zugriff nicht möglich. Bitte Berechtigungen prüfen.")
      setIsScanning(false)
    }
  }, [onScan, lastScanned])

  useEffect(() => {
    // Start scanning when component mounts
    startScanning()

    // Cleanup on unmount
    return () => {
      stopScanning()
    }
  }, [startScanning, stopScanning])

  return (
    <div className={cn("fixed inset-0 z-50 bg-black", className)}>
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-4 bg-gradient-to-b from-black/80 to-transparent">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          <ScanLine className="w-5 h-5" />
          Barcode scannen
        </h2>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="text-white hover:bg-white/20"
        >
          <X className="w-6 h-6" />
        </Button>
      </div>

      {/* Scanner Area */}
      <div className="relative w-full h-full flex items-center justify-center">
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          playsInline
          muted
        />

        {/* Scan overlay */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="relative w-64 h-48">
            {/* Corner markers */}
            <div className="absolute top-0 left-0 w-8 h-8 border-l-4 border-t-4 border-accent-primary" />
            <div className="absolute top-0 right-0 w-8 h-8 border-r-4 border-t-4 border-accent-primary" />
            <div className="absolute bottom-0 left-0 w-8 h-8 border-l-4 border-b-4 border-accent-primary" />
            <div className="absolute bottom-0 right-0 w-8 h-8 border-r-4 border-b-4 border-accent-primary" />

            {/* Scan line animation */}
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-accent-primary animate-pulse" 
              style={{
                animation: "scan 2s linear infinite",
              }}
            />
          </div>
        </div>

        {/* Instructions */}
        <div className="absolute bottom-20 left-0 right-0 text-center">
          <p className="text-white/80 text-sm bg-black/50 px-4 py-2 rounded-lg inline-block">
            Halte den Barcode innerhalb des Rahmens
          </p>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-accent-danger">
          <p className="text-white text-center">{error}</p>
        </div>
      )}

      <style jsx>{`
        @keyframes scan {
          0% { transform: translateY(0); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translateY(192px); opacity: 0; }
        }
      `}</style>
    </div>
  )
}
