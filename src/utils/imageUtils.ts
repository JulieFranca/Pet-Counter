export const convertImageToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
};

export const saveBase64Image = async (base64Data: string, fileName: string): Promise<string> => {
  try {
    const response = await fetch('/api/upload', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image: base64Data,
        fileName,
        directory: 'src/assets/pet-imgs'
      }),
    });

    if (!response.ok) {
      throw new Error('Erro ao salvar imagem');
    }

    const data = await response.json();
    return data.imageUrl;
  } catch (error) {
    console.error('Erro ao salvar imagem:', error);
    throw error;
  }
}; 