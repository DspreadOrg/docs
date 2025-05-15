/**
 * Utility functions for handling images in the documentation
 */

/**
 * Creates a GitHub CDN URL for an image
 * @param {string} path - The path to the image (e.g., '/images/example.png')
 * @param {boolean} useWebP - Whether to use WebP format if available
 * @returns {string} The GitHub CDN URL
 */
export function getGithubCdnUrl(path, useWebP = false) {
  // Remove leading slash if present
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;

  if (useWebP) {
    // Convert path to WebP format (e.g., images/file.png -> images/webp/file.webp)
    const pathInfo = cleanPath.match(/(.+)\.([^.]+)$/);
    if (pathInfo) {
      const pathWithoutExt = pathInfo[1];
      // Encode spaces and special characters
      const encodedPath = pathWithoutExt.replace(/ /g, '%20').replace('images/', 'images/webp/');
      return `https://raw.githubusercontent.com/DspreadOrg/docs/main/public/${encodedPath}.webp`;
    }
  }

  // Encode spaces and special characters
  const encodedPath = cleanPath.replace(/ /g, '%20');
  return `https://raw.githubusercontent.com/DspreadOrg/docs/main/public/${encodedPath}`;
}

/**
 * Creates image sources with WebP and fallback support
 * @param {string} path - The path to the image (e.g., '/images/example.png')
 * @param {boolean} isDev - Whether the app is running in development mode
 * @param {string} basePath - The base path for the app
 * @returns {Object} An object with webpSrc, originalSrc, and imageType
 */
export function getImageSources(path, isDev, basePath = '') {
  // Handle image path with correct basePath
  const imagePath = path.startsWith('/') ? path : `/${path}`;

  // Get the image name without extension
  const imagePathInfo = imagePath.match(/(.+)\.([^.]+)$/);
  if (!imagePathInfo) {
    return {
      webpSrc: null,
      originalSrc: null,
      imageType: null
    };
  }

  const imagePathWithoutExt = imagePathInfo[1];
  const imageExt = imagePathInfo[2];

  // Create WebP path
  const webpPath = `${imagePathWithoutExt.replace('/images/', '/images/webp/')}.webp`;

  // Use local paths in development, CDN in production
  const webpImageSrc = isDev
    ? `${webpPath}`
    : getGithubCdnUrl(imagePath, true);

  const originalImageSrc = isDev
    ? `${imagePath}`
    : getGithubCdnUrl(imagePath);

  return {
    webpSrc: webpImageSrc,
    originalSrc: originalImageSrc,
    imageType: imageExt
  };
}
