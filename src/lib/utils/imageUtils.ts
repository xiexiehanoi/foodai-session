export const convertImageToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const base64String = reader.result as string
      // Remove the data:image/...;base64, prefix
      const base64Data = base64String.split(',')[1]
      resolve(base64Data)
    }
    reader.onerror = (error) => reject(error)
    reader.readAsDataURL(file)
  })
}

export const getImageMimeType = (file: File): string => {
  return file.type
}

export const getImageSize = (file: File): number => {
  return file.size
}

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}