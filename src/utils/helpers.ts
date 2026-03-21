export const formatDateVisual = (dateStr: string | null | undefined) => {
  if (!dateStr) return 'S/F';
  try {
    const isIso = dateStr.includes('-');
    const simpleDate = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;
    
    // Si ya tiene formato visual o no es ISO, devolver como está
    if (!isIso) return dateStr;

    const [year, month, day] = simpleDate.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    
    if (isNaN(date.getTime())) return dateStr;
    
    return date.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  } catch (e) {
    return dateStr;
  }
};

export const formatDateTimeVisual = (dateStr: string | null | undefined) => {
  if (!dateStr) return 'S/F';
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    
    const datePart = date.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
    
    const timePart = date.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    });
    
    return `${datePart} ${timePart}`;
  } catch (e) {
    return dateStr;
  }
};

export const compressImage = (base64: string, maxWidth: number = 800, maxHeight: number = 600): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > maxWidth) {
          height *= maxWidth / width;
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width *= maxHeight / height;
          height = maxHeight;
        }
      }
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', 0.7));
    };
    img.onerror = reject;
    img.src = base64;
  });
};
