/**
 * Cloudinary Upload Service
 * Handles direct unsigned uploads to Cloudinary from the browser.
 */

const CLOUDINARY_CLOUD_NAME = 'dc64co0el';
const CLOUDINARY_UPLOAD_PRESET = 'pharma_chain';

export const cloudinaryService = {
  /**
   * Upload an image to Cloudinary
   * @param {File} file The file object to upload
   * @returns {Promise<string>} The URL of the uploaded image
   */
  async uploadImage(file) {
    if (!file) return null;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
    formData.append('folder', 'PharmaTrace VN'); // Optional: organize in folders

    try {
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
        {
          method: 'POST',
          body: formData,
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Upload failed');
      }

      const data = await response.json();
      return data.secure_url;
    } catch (error) {
      console.error('[CloudinaryService.uploadImage] Error:', error);
      throw error;
    }
  }
};
