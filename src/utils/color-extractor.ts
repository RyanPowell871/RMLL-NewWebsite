// Utility to extract dominant colors from team logos

export interface ExtractedColors {
  primary: string;
  secondary: string;
  accent: string;
  isDark: boolean;
}

interface RGBColor {
  r: number;
  g: number;
  b: number;
}

// Convert RGB to Hex
function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map(x => {
    const hex = Math.round(x).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('');
}

// Calculate color brightness (0-255)
function getBrightness(r: number, g: number, b: number): number {
  return (r * 299 + g * 587 + b * 114) / 1000;
}

// Calculate color saturation
function getSaturation(r: number, g: number, b: number): number {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  if (max === 0) return 0;
  return ((max - min) / max) * 100;
}

// Calculate color distance
function colorDistance(c1: RGBColor, c2: RGBColor): number {
  return Math.sqrt(
    Math.pow(c1.r - c2.r, 2) +
    Math.pow(c1.g - c2.g, 2) +
    Math.pow(c1.b - c2.b, 2)
  );
}

// Darken a color by a percentage
function darkenColor(hex: string, percent: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.max(0, Math.floor((num >> 16) * (1 - percent / 100)));
  const g = Math.max(0, Math.floor(((num >> 8) & 0x00FF) * (1 - percent / 100)));
  const b = Math.max(0, Math.floor((num & 0x0000FF) * (1 - percent / 100)));
  return rgbToHex(r, g, b);
}

// Lighten a color by a percentage
function lightenColor(hex: string, percent: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.min(255, Math.floor((num >> 16) + (255 - (num >> 16)) * (percent / 100)));
  const g = Math.min(255, Math.floor(((num >> 8) & 0x00FF) + (255 - ((num >> 8) & 0x00FF)) * (percent / 100)));
  const b = Math.min(255, Math.floor((num & 0x0000FF) + (255 - (num & 0x0000FF)) * (percent / 100)));
  return rgbToHex(r, g, b);
}

/**
 * Extract dominant colors from a team logo image
 */
export async function extractColorsFromImage(imageUrl: string): Promise<ExtractedColors> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    
    img.onload = () => {
      try {
        // Create canvas and draw image
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          throw new Error('Could not get canvas context');
        }
        
        // Resize image to smaller size for faster processing
        const maxSize = 100;
        const scale = Math.min(maxSize / img.width, maxSize / img.height);
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        // Get image data
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const pixels = imageData.data;
        
        // Color histogram with binning to reduce unique colors
        const colorMap = new Map<string, { count: number; rgb: RGBColor }>();
        const binSize = 20; // Group similar colors
        
        // Sample every other pixel for performance
        for (let i = 0; i < pixels.length; i += 8) {
          const r = pixels[i];
          const g = pixels[i + 1];
          const b = pixels[i + 2];
          const a = pixels[i + 3];
          
          // Skip transparent or near-white/black pixels
          if (a < 128) continue;
          const brightness = getBrightness(r, g, b);
          if (brightness > 240 || brightness < 15) continue;
          
          // Skip colors with low saturation (too gray)
          const saturation = getSaturation(r, g, b);
          if (saturation < 15) continue;
          
          // Bin the color
          const rBin = Math.floor(r / binSize) * binSize;
          const gBin = Math.floor(g / binSize) * binSize;
          const bBin = Math.floor(b / binSize) * binSize;
          const key = `${rBin},${gBin},${bBin}`;
          
          const existing = colorMap.get(key);
          if (existing) {
            existing.count++;
          } else {
            colorMap.set(key, { count: 1, rgb: { r: rBin, g: gBin, b: bBin } });
          }
        }
        
        // Sort colors by frequency
        const sortedColors = Array.from(colorMap.values())
          .sort((a, b) => b.count - a.count);
        
        if (sortedColors.length === 0) {
          // Fallback if no colors found
          resolve({
            primary: '#0F2942',
            secondary: '#DC2626',
            accent: '#FFFFFF',
            isDark: true
          });
          return;
        }
        
        // Get primary color (most frequent)
        const primaryRGB = sortedColors[0].rgb;
        const primary = rgbToHex(primaryRGB.r, primaryRGB.g, primaryRGB.b);
        
        // Find secondary color (most different from primary)
        let secondaryRGB = sortedColors[0].rgb;
        let maxDistance = 0;
        
        for (let i = 1; i < Math.min(10, sortedColors.length); i++) {
          const distance = colorDistance(primaryRGB, sortedColors[i].rgb);
          if (distance > maxDistance) {
            maxDistance = distance;
            secondaryRGB = sortedColors[i].rgb;
          }
        }
        
        let secondary = rgbToHex(secondaryRGB.r, secondaryRGB.g, secondaryRGB.b);
        
        // If secondary is too similar to primary, create a darker variant
        if (maxDistance < 100) {
          secondary = darkenColor(primary, 30);
        }
        
        // Determine if primary color is dark
        const primaryBrightness = getBrightness(primaryRGB.r, primaryRGB.g, primaryRGB.b);
        const isDark = primaryBrightness < 128;
        
        // Choose accent color (usually white or a light color)
        // If both primary and secondary are dark, use white
        // Otherwise, find a light color or use white
        const secondaryBrightness = getBrightness(secondaryRGB.r, secondaryRGB.g, secondaryRGB.b);
        let accent = '#FFFFFF';
        
        if (!isDark && secondaryBrightness > 150) {
          // Both are light, use a darker accent or a vibrant color
          const darkColor = sortedColors.find(c => getBrightness(c.rgb.r, c.rgb.g, c.rgb.b) < 100);
          if (darkColor) {
            accent = rgbToHex(darkColor.rgb.r, darkColor.rgb.g, darkColor.rgb.b);
          } else {
            accent = darkenColor(primary, 50);
          }
        } else {
          // Look for a light/vibrant accent color
          const lightColor = sortedColors.find(c => {
            const b = getBrightness(c.rgb.r, c.rgb.g, c.rgb.b);
            const s = getSaturation(c.rgb.r, c.rgb.g, c.rgb.b);
            return b > 180 && s > 20;
          });
          
          if (lightColor) {
            accent = rgbToHex(lightColor.rgb.r, lightColor.rgb.g, lightColor.rgb.b);
          }
        }
        
        resolve({
          primary,
          secondary,
          accent,
          isDark
        });
      } catch (error) {
        console.error('Error extracting colors:', error);
        reject(error);
      }
    };
    
    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };
    
    img.src = imageUrl;
  });
}

/**
 * Get contrasting text color (black or white) for a background color
 */
export function getContrastColor(hexColor: string): string {
  const num = parseInt(hexColor.replace('#', ''), 16);
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  
  const brightness = getBrightness(r, g, b);
  return brightness > 128 ? '#000000' : '#FFFFFF';
}

/**
 * Generate a color palette from primary color
 */
export function generateColorPalette(primaryColor: string): {
  light: string;
  main: string;
  dark: string;
} {
  return {
    light: lightenColor(primaryColor, 20),
    main: primaryColor,
    dark: darkenColor(primaryColor, 20)
  };
}

// Default fallback colors
export const DEFAULT_COLORS: ExtractedColors = {
  primary: '#0F2942',
  secondary: '#DC2626',
  accent: '#FFFFFF',
  isDark: true
};
