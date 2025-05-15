import React from 'react';
import { useConfig } from 'nextra-theme-docs';

export default function ResponsiveImage({
  src,
  alt,
  className = '',
  style = {},
  width,
  height,
  ...props
}) {
  const config = useConfig();
  const basePath = config.basePath || '';
  const isDev = process.env.NODE_ENV === 'development';

  // Handle image path with correct basePath for both dev and production
  const imagePath = src.startsWith('/') ? src : `/${src}`;

  // Get the image name without extension for WebP conversion
  const imagePathInfo = imagePath.match(/(.+)\.([^.]+)$/);
  if (!imagePathInfo) {
    console.error(`Invalid image path: ${imagePath}`);
    return null;
  }

  const imagePathWithoutExt = imagePathInfo[1];
  const imageExt = imagePathInfo[2];

  // Create WebP path
  const webpPath = `${imagePathWithoutExt.replace('/images/', '/images/webp/')}.webp`;

  // Create GitHub CDN URLs for WebP and original images
  const getGithubCdnUrl = (path) => {
    // Remove leading slash if present
    const cleanPath = path.startsWith('/') ? path.slice(1) : path;
    // Encode spaces and special characters in the URL
    const encodedPath = cleanPath.replace(/ /g, '%20');
    return `https://raw.githubusercontent.com/DspreadOrg/docs/main/public/${encodedPath}`;
  };

  // Use local paths in development, CDN in production
  const webpImageSrc = isDev
    ? `${webpPath}`
    : getGithubCdnUrl(webpPath);

  const originalImageSrc = isDev
    ? `${imagePath}`
    : getGithubCdnUrl(imagePath);

  // Fallback image path
  const fallbackImagePath = isDev
    ? `/dspread-logo.png`
    : getGithubCdnUrl('dspread-logo.png');

  return (
    <picture>
      <source srcSet={`${webpImageSrc} 1x`} type="image/webp" />
      <img
        src={originalImageSrc}
        alt={alt || 'Image'}
        className={className}
        style={style}
        width={width}
        height={height}
        loading="lazy"
        onError={(e) => {
          console.error(`Failed to load image: ${e.target.src}`);
          e.target.onerror = null;
          e.target.src = fallbackImagePath;
        }}
        {...props}
      />
    </picture>
  );
}
