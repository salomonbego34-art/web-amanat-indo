import { useEffect, useMemo, useRef, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";

export function ProfileImageCropper({
  file,
  open,
  onOpenChange,
  onComplete,
}: {
  file: File | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: (dataUrl: string) => void;
}) {
  const [imageSrc, setImageSrc] = useState("");
  const [zoom, setZoom] = useState(1);
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!file) return;
    const objectUrl = URL.createObjectURL(file);
    setImageSrc(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);

  const imageStyle = useMemo(
    () => ({
      transform: `translate(${offsetX}px, ${offsetY}px) scale(${zoom})`,
    }),
    [offsetX, offsetY, zoom],
  );

  const cropImage = async () => {
    if (!imageSrc || !canvasRef.current) return;
    const image = new Image();
    image.src = imageSrc;
    await image.decode();

    const canvas = canvasRef.current;
    const size = 320;
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, size, size);
    ctx.save();
    ctx.translate(size / 2 + offsetX, size / 2 + offsetY);
    ctx.scale(zoom, zoom);
    const ratio = Math.max(size / image.width, size / image.height);
    const width = image.width * ratio;
    const height = image.height * ratio;
    ctx.drawImage(image, -width / 2, -height / 2, width, height);
    ctx.restore();

    onComplete(canvas.toDataURL("image/png"));
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl rounded-3xl">
        <DialogHeader>
          <DialogTitle>Crop Foto Profil</DialogTitle>
          <DialogDescription>Atur posisi, zoom, dan preview sebelum menyimpan.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="relative flex h-[360px] items-center justify-center overflow-hidden rounded-3xl border-4 border-border shadow-xl bg-gradient-to-br from-muted/30 to-card">
            {/* Checkerboard transparency background */}
            <div className="absolute inset-0 bg-[linear-gradient(45deg,#f0f0f0_25%,transparent_25%),linear-gradient(-45deg,#f0f0f0_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#f0f0f0_75%),linear-gradient(-45deg,transparent_75%,#f0f0f0_75%)] bg-[size:20px_20px] bg-[position:0_0,0_10px,10px_-10px,-10px_0px]" />
            
            {/* Overlay mask for transparency effect */}
            <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
            
            {/* Circular crop area with enhanced transparency preview */}
            <div className="absolute h-[280px] w-[280px] rounded-full border-4 border-primary/90 ring-4 ring-primary/30 shadow-2xl shadow-primary/25 z-20 pointer-events-none" />
            
            {imageSrc ? (
              <img
                src={imageSrc}
                alt="Crop preview"
                className="absolute max-h-full max-w-full cursor-move select-none z-10 drop-shadow-lg"
                style={imageStyle}
                draggable={false}
              />
            ) : null}
          </div>


          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <p className="mb-2 text-sm font-medium">Zoom</p>
              <Slider value={[zoom]} min={1} max={3} step={0.05} onValueChange={(value) => setZoom(value[0] || 1)} />
            </div>
            <div>
              <p className="mb-2 text-sm font-medium">Geser Horizontal</p>
              <Slider value={[offsetX]} min={-140} max={140} step={1} onValueChange={(value) => setOffsetX(value[0] || 0)} />
            </div>
            <div>
              <p className="mb-2 text-sm font-medium">Geser Vertikal</p>
              <Slider value={[offsetY]} min={-140} max={140} step={1} onValueChange={(value) => setOffsetY(value[0] || 0)} />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Batal</Button>
          <Button className="rounded-xl" onClick={cropImage}>Simpan Crop</Button>
        </DialogFooter>

        <canvas ref={canvasRef} className="hidden" />
      </DialogContent>
    </Dialog>
  );
}
