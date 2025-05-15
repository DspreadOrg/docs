const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const imagesDir = path.join(__dirname, '../public/images');
const webpDir = path.join(__dirname, '../public/images/webp');

// Create webp directory if it doesn't exist
if (!fs.existsSync(webpDir)) {
  fs.mkdirSync(webpDir, { recursive: true });
}

// Get all PNG and JPG files in the images directory
const imageFiles = fs.readdirSync(imagesDir).filter(file => {
  const ext = path.extname(file).toLowerCase();
  return ext === '.png' || ext === '.jpg' || ext === '.jpeg';
});

// Convert each image to WebP format
async function convertImages() {
  console.log(`Found ${imageFiles.length} images to convert`);
  
  for (const file of imageFiles) {
    const inputPath = path.join(imagesDir, file);
    const outputPath = path.join(webpDir, `${path.parse(file).name}.webp`);
    
    try {
      // Get image info
      const metadata = await sharp(inputPath).metadata();
      console.log(`Converting ${file} (${metadata.width}x${metadata.height}, ${Math.round(fs.statSync(inputPath).size / 1024)}KB)`);
      
      // Convert to WebP with 80% quality (good balance between quality and file size)
      await sharp(inputPath)
        .webp({ quality: 80 })
        .toFile(outputPath);
      
      // Log the size reduction
      const originalSize = fs.statSync(inputPath).size;
      const webpSize = fs.statSync(outputPath).size;
      const reduction = Math.round((1 - webpSize / originalSize) * 100);
      
      console.log(`✓ Converted ${file} to WebP. Size reduced by ${reduction}% (${Math.round(originalSize / 1024)}KB → ${Math.round(webpSize / 1024)}KB)`);
    } catch (error) {
      console.error(`Error converting ${file}:`, error);
    }
  }
}

convertImages().then(() => {
  console.log('All images converted successfully!');
}).catch(err => {
  console.error('Error converting images:', err);
});
