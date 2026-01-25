# TRII Platform - Icon Design Specification

## Design Philosophy

The TRII Investment Platform icon should convey:
- **Professionalism**: Financial industry standards
- **Technology**: Modern, data-driven approach
- **Growth**: Investment and opportunity detection
- **Reliability**: Trustworthy investment decisions

## Color Palette

### Primary Colors
- **TRII Blue**: `#2563EB` (RGB: 37, 99, 235)
  - Primary brand color, represents trust and stability
  - Used for main icon elements

- **TRII Teal**: `#06B6D4` (RGB: 6, 182, 212)
  - Secondary accent, represents growth and opportunity
  - Used for highlights and accents

### Supporting Colors
- **Deep Navy**: `#1E293B` (RGB: 30, 41, 59)
  - Dark background elements

- **Success Green**: `#10B981` (RGB: 16, 185, 129)
  - Positive growth indicators

- **Warning Amber**: `#F59E0B` (RGB: 245, 158, 11)
  - Alert/attention elements

- **White**: `#FFFFFF` (RGB: 255, 255, 255)
  - Contrast and clarity

## Icon Concept

### Main Design: "Rising Trend Arrow with Data Points"

**Central Element**: Upward trending arrow representing investment growth
**Supporting Elements**:
- Data points/nodes representing AI/ML analysis
- Subtle grid background representing market data
- Clean, minimalist design for scalability

### Design Specifications

**Canvas Size**: 1024x1024 pixels (base)
**Safe Area**: 896x896 pixels (88% of canvas, accounting for rounded corners)
**Minimum Size**: Must be legible at 16x16 pixels

### Icon Components

1. **Background Circle** (1024x1024)
   - Gradient from TRII Blue (#2563EB) to Deep Navy (#1E293B)
   - Subtle radial gradient for depth

2. **Trend Arrow** (centered, ~60% of safe area)
   - Smooth upward curve from bottom-left to top-right
   - Width: 80px at base
   - Color: White (#FFFFFF) with subtle shadow
   - Style: Rounded ends, smooth bezier curve

3. **Data Points** (3-5 nodes)
   - Circles along the trend line
   - Size gradient: 40px → 60px → 80px (growing)
   - Color: TRII Teal (#06B6D4) with glow effect
   - Represents AI-driven analysis

4. **Grid Background** (optional, subtle)
   - Light grid pattern (10% opacity)
   - Represents market data/charts
   - Color: White (#FFFFFF)

## Required Output Formats

### macOS
- **icon.icns** (ICNS format)
  - Required sizes: 16x16, 32x32, 64x64, 128x128, 256x256, 512x512, 1024x1024
  - Both standard and @2x retina versions
  - Generated from 1024x1024 base

### Windows
- **icon.ico** (ICO format)
  - Required sizes: 16x16, 24x24, 32x32, 48x48, 64x64, 128x128, 256x256
  - Supports transparency
  - Generated from 1024x1024 base

### Linux
- **icon.png** (PNG format)
  - Sizes: 16x16, 32x32, 48x48, 64x64, 128x128, 256x256, 512x512, 1024x1024
  - Transparent background
  - Placed in appropriate subdirectories

### Web/Installer Graphics
- **icon-1024.png**: Base PNG for processing
- **installer-sidebar.png**: 164x314 (Windows installer sidebar)
- **installer-header.png**: 150x57 (Windows installer header)
- **dmg-background.png**: 540x380 (macOS DMG background)
- **dmg-icon.icns**: 128x128 (macOS DMG volume icon)

## File Structure

```
apps/desktop-client/resources/
├── ICON_DESIGN_SPEC.md              # This file
├── icon-source.svg                  # Master SVG source
├── icon-1024.png                    # 1024x1024 PNG base
├── icons/
│   ├── mac/
│   │   └── icon.icns               # macOS icon bundle
│   ├── win/
│   │   └── icon.ico                # Windows icon bundle
│   └── png/
│       ├── 16x16.png
│       ├── 32x32.png
│       ├── 48x48.png
│       ├── 64x64.png
│       ├── 128x128.png
│       ├── 256x256.png
│       ├── 512x512.png
│       └── 1024x1024.png
├── installer/
│   ├── windows/
│   │   ├── sidebar.png             # 164x314
│   │   └── header.png              # 150x57
│   └── mac/
│       ├── dmg-background.png      # 540x380
│       └── dmg-icon.icns           # DMG volume icon
└── build-icons.sh                   # Icon generation script

```

## Design Guidelines

### Scalability
- Icon must remain recognizable at 16x16 pixels
- Simplify details at smaller sizes (remove grid, reduce data points)
- Ensure arrow remains primary focal point

### Accessibility
- Maintain 4.5:1 contrast ratio for WCAG AA compliance
- Test with color blindness simulators
- Avoid relying solely on color for meaning

### Platform Consistency
- Respect platform design languages (macOS Big Sur+, Windows 11, Linux)
- Use appropriate shadows and depth for each platform
- Follow rounded corner guidelines (macOS: continuous corner, Windows: subtle rounding)

## Tools for Icon Generation

### Recommended Tools
1. **Vector Design**: Adobe Illustrator, Figma, Inkscape (free)
2. **PNG Export**: Export at 2x size, downscale with bicubic sampling
3. **ICNS Creation**: `png2icns` (macOS) or `electron-icon-maker`
4. **ICO Creation**: `convert` (ImageMagick) or `png-to-ico`

### Automated Generation
```bash
# Install dependencies
npm install -g electron-icon-maker

# Generate all icons from 1024x1024 PNG
electron-icon-maker --input=icon-1024.png --output=./icons/
```

## Alternative Design Concepts

### Concept 2: "Triple Investment Bars"
- Three vertical bars of increasing height (representing TRII = Triple Return on Investment Insights)
- Modern, abstract representation
- Clean and minimalist

### Concept 3: "Market Pulse"
- Stylized waveform/heartbeat representing market activity
- Combined with upward trend
- Dynamic and energetic

## Next Steps

1. Create SVG source file based on "Rising Trend Arrow" concept
2. Export 1024x1024 PNG base image
3. Generate all required icon formats
4. Create installer graphics
5. Test icons on all platforms (macOS, Windows, Linux)
6. Integrate with electron-builder configuration

---

**Version**: 1.0.0
**Last Updated**: 2025-12-31
**Designer**: TRII Platform Team
**Status**: Ready for Implementation
