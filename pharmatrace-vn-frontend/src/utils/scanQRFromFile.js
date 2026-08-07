/**
 * Scan a QR code from an image File using jsQR (pure in-memory, no DOM element required).
 * @param {File} file - The image file to scan
 * @returns {Promise<string>} - The decoded QR code text
 */
export async function scanQRFromFile(file) {
  const jsQR = (await import('jsqr')).default

  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(url)

      const canvas = document.createElement('canvas')
      canvas.width = img.naturalWidth
      canvas.height = img.naturalHeight

      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, 0, 0)

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: 'dontInvert',
      })

      if (code && code.data) {
        resolve(code.data)
      } else {
        reject(new Error('No QR code found in image'))
      }
    }

    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Failed to load image'))
    }

    img.src = url
  })
}
