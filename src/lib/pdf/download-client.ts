'use client';

import { toast } from 'sonner';

export async function downloadPdfFile(url: string, defaultFilename = 'ficha-treino-gkong.pdf') {
  const toastId = toast.loading('Gerando PDF...', {
    description: 'Diagramando sua ficha com imagens e dados.',
  });

  try {
    const response = await fetch(url);
    if (!response.ok) {
      const data = (await response.json().catch(() => ({}))) as { error?: string };
      throw new Error(data.error || 'Não foi possível baixar o PDF.');
    }

    // Try to read filename from content-disposition header if available
    const disposition = response.headers.get('content-disposition');
    let filename = defaultFilename;
    if (disposition && disposition.includes('filename=')) {
      const match = disposition.match(/filename="?([^";]+)"?/i);
      if (match && match[1]) {
        filename = decodeURIComponent(match[1]);
      }
    }

    const blob = await response.blob();
    const blobUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = filename;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();

    setTimeout(() => {
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    }, 2500);

    toast.success('Download do PDF concluído!', {
      id: toastId,
      description: 'O arquivo foi salvo no seu dispositivo.',
    });
  } catch (error) {
    toast.error(error instanceof Error ? error.message : 'Falha ao baixar o PDF.', {
      id: toastId,
      description: 'Tente novamente em instantes.',
    });
  }
}
