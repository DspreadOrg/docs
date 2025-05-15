import React from 'react';
import { useConfig } from 'nextra-theme-docs';
import Link from 'next/link';

export default function FeatureCard({
  image,
  link,
  linkText
}) {
  const config = useConfig();
  const basePath = config.basePath || '';
  const isDev = process.env.NODE_ENV === 'development';

  // Handle image path with correct basePath for both dev and production
  const imagePath = image.startsWith('/') ? image : `/${image}`;

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

  // Check if the link is external (starts with http:// or https://)
  const isExternalLink = link.startsWith('http://') || link.startsWith('https://');

  // Prepare internal link path
  let internalPath = '';
  if (!isExternalLink) {
    const linkPath = link.startsWith('/') ? link : `/${link}`;
    internalPath = linkPath;
  }

  // Fallback image path
  const fallbackImagePath = isDev
    ? `/dspread-logo.png`
    : getGithubCdnUrl('dspread-logo.png');

  // Image component with picture element
  const ImageComponent = () => (
    <picture>
      <source srcSet={`${webpImageSrc} 1x`} type="image/webp" />
      <img
        src={originalImageSrc}
        alt={linkText || 'Feature image'}
        className="feature-card-image"
        loading="lazy"
        onError={(e) => {
          console.error(`Failed to load image: ${e.target.src}`);
          e.target.onerror = null;
          e.target.src = fallbackImagePath;
        }}
      />
    </picture>
  );

  return (
    <div className="feature-card">
      <div className="feature-card-content">
        {isExternalLink ? (
          <a
            href={link}
            className="feature-card-image-link"
            target="_blank"
            rel="noopener noreferrer"
          >
            <ImageComponent />
          </a>
        ) : (
          <Link href={internalPath} className="feature-card-image-link">
            <ImageComponent />
          </Link>
        )}
      </div>

      {isExternalLink ? (
        <a
          href={link}
          className="feature-card-link-text"
          target="_blank"
          rel="noopener noreferrer"
        >
          {linkText} &gt;
        </a>
      ) : (
        <Link href={internalPath} className="feature-card-link-text">
          {linkText} &gt;
        </Link>
      )}
    </div>
  );
}
