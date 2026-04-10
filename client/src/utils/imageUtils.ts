export async function optimizeImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      reject(new Error('Canvas not supported'));
      return;
    }

    const img = new Image();
    img.onload = () => {
      // Max dimensions for optimization
      const maxWidth = 1024;
      const maxHeight = 1024;
      let { width, height } = img;

      // Resize if needed
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width *= ratio;
        height *= ratio;
      }

      canvas.width = width;
      canvas.height = height;

      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, width, height);

      // Convert to webp for better compression (fallback jpeg)
      canvas.toBlob(
        (blob) => {
          if (blob) {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.readAsDataURL(blob);
          } else {
            reject(new Error('Failed to create blob'));
          }
        },
        'image/webp',
        0.8 // 80% quality
      );
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

// Batch optimize multiple files
export async function optimizeMultipleImages(files: File[]): Promise<string[]> {
  const optimized = await Promise.all(
    files.map(optimizeImage)
  );
  return optimized;
}

