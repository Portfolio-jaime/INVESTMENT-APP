#!/bin/bash
#
# Icon Build Script for TRII Platform
# Generates all required icon formats from SVG source
#
# Prerequisites:
#   - ImageMagick (brew install imagemagick)
#   - librsvg (brew install librsvg)
#   - png2icns (brew install libicns)
#   - icnsutils (for Linux: apt-get install icnsutils)
#

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SOURCE_SVG="$SCRIPT_DIR/icon-source.svg"
BASE_PNG="$SCRIPT_DIR/icon-1024.png"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  TRII Platform - Icon Generation Script${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo ""

# Check dependencies
check_dependency() {
    if ! command -v "$1" &> /dev/null; then
        echo -e "${RED}✗ $1 is not installed${NC}"
        echo -e "${YELLOW}  Install with: $2${NC}"
        return 1
    else
        echo -e "${GREEN}✓ $1 is installed${NC}"
        return 0
    fi
}

echo -e "${BLUE}Checking dependencies...${NC}"
DEPS_OK=true
check_dependency "rsvg-convert" "brew install librsvg" || DEPS_OK=false
check_dependency "convert" "brew install imagemagick" || DEPS_OK=false
check_dependency "png2icns" "brew install libicns" || DEPS_OK=false

if [ "$DEPS_OK" = false ]; then
    echo -e "\n${RED}Missing dependencies. Please install them first.${NC}"
    exit 1
fi

echo ""

# Create directory structure
echo -e "${BLUE}Creating directory structure...${NC}"
mkdir -p "$SCRIPT_DIR/icons/mac"
mkdir -p "$SCRIPT_DIR/icons/win"
mkdir -p "$SCRIPT_DIR/icons/png"
mkdir -p "$SCRIPT_DIR/installer/windows"
mkdir -p "$SCRIPT_DIR/installer/mac"
echo -e "${GREEN}✓ Directories created${NC}"
echo ""

# Generate base 1024x1024 PNG from SVG
echo -e "${BLUE}Generating base PNG (1024x1024)...${NC}"
rsvg-convert -w 1024 -h 1024 "$SOURCE_SVG" -o "$BASE_PNG"
echo -e "${GREEN}✓ Base PNG generated: $BASE_PNG${NC}"
echo ""

# Generate PNG icons in all required sizes
echo -e "${BLUE}Generating PNG icons...${NC}"
PNG_SIZES=(16 32 48 64 128 256 512 1024)
for size in "${PNG_SIZES[@]}"; do
    output="$SCRIPT_DIR/icons/png/${size}x${size}.png"
    rsvg-convert -w "$size" -h "$size" "$SOURCE_SVG" -o "$output"
    echo -e "${GREEN}  ✓ ${size}x${size}.png${NC}"
done
echo ""

# Generate macOS ICNS
echo -e "${BLUE}Generating macOS ICNS...${NC}"
TEMP_ICONSET="$SCRIPT_DIR/icons/mac/icon.iconset"
mkdir -p "$TEMP_ICONSET"

# Generate all required sizes for macOS
rsvg-convert -w 16 -h 16 "$SOURCE_SVG" -o "$TEMP_ICONSET/icon_16x16.png"
rsvg-convert -w 32 -h 32 "$SOURCE_SVG" -o "$TEMP_ICONSET/icon_16x16@2x.png"
rsvg-convert -w 32 -h 32 "$SOURCE_SVG" -o "$TEMP_ICONSET/icon_32x32.png"
rsvg-convert -w 64 -h 64 "$SOURCE_SVG" -o "$TEMP_ICONSET/icon_32x32@2x.png"
rsvg-convert -w 128 -h 128 "$SOURCE_SVG" -o "$TEMP_ICONSET/icon_128x128.png"
rsvg-convert -w 256 -h 256 "$SOURCE_SVG" -o "$TEMP_ICONSET/icon_128x128@2x.png"
rsvg-convert -w 256 -h 256 "$SOURCE_SVG" -o "$TEMP_ICONSET/icon_256x256.png"
rsvg-convert -w 512 -h 512 "$SOURCE_SVG" -o "$TEMP_ICONSET/icon_256x256@2x.png"
rsvg-convert -w 512 -h 512 "$SOURCE_SVG" -o "$TEMP_ICONSET/icon_512x512.png"
rsvg-convert -w 1024 -h 1024 "$SOURCE_SVG" -o "$TEMP_ICONSET/icon_512x512@2x.png"

# Convert to ICNS
iconutil -c icns "$TEMP_ICONSET" -o "$SCRIPT_DIR/icons/mac/icon.icns"
rm -rf "$TEMP_ICONSET"
echo -e "${GREEN}✓ macOS ICNS generated${NC}"
echo ""

# Generate Windows ICO
echo -e "${BLUE}Generating Windows ICO...${NC}"
convert \
    "$SCRIPT_DIR/icons/png/16x16.png" \
    "$SCRIPT_DIR/icons/png/32x32.png" \
    "$SCRIPT_DIR/icons/png/48x48.png" \
    "$SCRIPT_DIR/icons/png/64x64.png" \
    "$SCRIPT_DIR/icons/png/128x128.png" \
    "$SCRIPT_DIR/icons/png/256x256.png" \
    "$SCRIPT_DIR/icons/win/icon.ico"
echo -e "${GREEN}✓ Windows ICO generated${NC}"
echo ""

# Generate installer graphics
echo -e "${BLUE}Generating installer graphics...${NC}"

# Windows installer sidebar (164x314)
rsvg-convert -w 164 -h 314 "$SOURCE_SVG" -o "$SCRIPT_DIR/installer/windows/sidebar.png"
echo -e "${GREEN}  ✓ Windows sidebar (164x314)${NC}"

# Windows installer header (150x57) - cropped version
rsvg-convert -w 150 -h 150 "$SOURCE_SVG" | \
    convert - -gravity center -crop 150x57+0+0 +repage \
    "$SCRIPT_DIR/installer/windows/header.png"
echo -e "${GREEN}  ✓ Windows header (150x57)${NC}"

# macOS DMG background (540x380)
rsvg-convert -w 540 -h 540 "$SOURCE_SVG" | \
    convert - -gravity center -crop 540x380+0+0 +repage \
    -background '#F3F4F6' -flatten \
    "$SCRIPT_DIR/installer/mac/dmg-background.png"
echo -e "${GREEN}  ✓ macOS DMG background (540x380)${NC}"

# macOS DMG volume icon (128x128)
TEMP_DMG_ICONSET="$SCRIPT_DIR/installer/mac/dmg-icon.iconset"
mkdir -p "$TEMP_DMG_ICONSET"

rsvg-convert -w 16 -h 16 "$SOURCE_SVG" -o "$TEMP_DMG_ICONSET/icon_16x16.png"
rsvg-convert -w 32 -h 32 "$SOURCE_SVG" -o "$TEMP_DMG_ICONSET/icon_16x16@2x.png"
rsvg-convert -w 32 -h 32 "$SOURCE_SVG" -o "$TEMP_DMG_ICONSET/icon_32x32.png"
rsvg-convert -w 64 -h 64 "$SOURCE_SVG" -o "$TEMP_DMG_ICONSET/icon_32x32@2x.png"
rsvg-convert -w 128 -h 128 "$SOURCE_SVG" -o "$TEMP_DMG_ICONSET/icon_128x128.png"
rsvg-convert -w 256 -h 256 "$SOURCE_SVG" -o "$TEMP_DMG_ICONSET/icon_128x128@2x.png"

iconutil -c icns "$TEMP_DMG_ICONSET" -o "$SCRIPT_DIR/installer/mac/dmg-icon.icns"
rm -rf "$TEMP_DMG_ICONSET"
echo -e "${GREEN}  ✓ macOS DMG icon${NC}"
echo ""

# Summary
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}✓ Icon generation complete!${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo ""
echo -e "${YELLOW}Generated files:${NC}"
echo -e "  • Base PNG: ${BASE_PNG}"
echo -e "  • PNG icons: $SCRIPT_DIR/icons/png/"
echo -e "  • macOS ICNS: $SCRIPT_DIR/icons/mac/icon.icns"
echo -e "  • Windows ICO: $SCRIPT_DIR/icons/win/icon.ico"
echo -e "  • Installer graphics: $SCRIPT_DIR/installer/"
echo ""
echo -e "${BLUE}Next steps:${NC}"
echo -e "  1. Review generated icons visually"
echo -e "  2. Test on all platforms (macOS, Windows, Linux)"
echo -e "  3. Update electron-builder configuration"
echo -e "  4. Build and test installers"
echo ""
