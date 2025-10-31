#!/bin/bash

# Weavy Rust Source Finder - Quick Shell Script
# Usage: ./quick_rust_finder.sh

echo "🚀 WEAVY RUST SOURCE DISCOVERY TOOL (SHELL VERSION)"
echo "==================================================="

BASE_URL="https://app.weavy.ai"
FLOW_URL="$BASE_URL/flow/i1duC9kjnRBvtFTQrecSqh"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Rust files to check
RUST_FILES=(
    "Cargo.toml"
    "Cargo.lock"
    "src/lib.rs"
    "src/main.rs"
    "src/graph.rs"
    "src/renderer.rs"
    "src/node.rs"
    "src/webgl.rs"
    "src/shader.rs"
    "src/wasm.rs"
    "src/render.rs"
    "src/pipeline.rs"
    "src/compositor.rs"
    "src/material.rs"
    "src/texture.rs"
    "src/buffer.rs"
    "src/program.rs"
    "src/uniform.rs"
    "build.rs"
    "README.md"
    "rust-toolchain.toml"
    "rust-toolchain"
    ".cargo/config.toml"
)

# Build files to check
BUILD_FILES=(
    "package.json"
    "webpack.config.js"
    "vite.config.js"
    "rollup.config.js"
    "tsconfig.json"
    "wrangler.toml"
    "wrangler.json"
    "turbo.json"
    "babel.config.js"
    "Makefile"
    ".gitignore"
    ".env"
    "Dockerfile"
)

# Base paths to check
BASE_PATHS=(
    "$BASE_URL"
    "$FLOW_URL"
    "$BASE_URL/src"
    "$BASE_URL/designer"
    "$BASE_URL/rust"
    "$BASE_URL/wasm"
    "$BASE_URL/core"
    "$BASE_URL/assets"
)

echo -e "\n${BLUE}🔍 Target: $BASE_URL${NC}"
echo -e "${BLUE}📍 Flow URL: $FLOW_URL${NC}"

# Function to check if URL exists
check_url() {
    local url="$1"
    local timeout="${2:-5}"

    # Use curl to check if URL exists (following redirects, but not downloading)
    if curl -s --max-time "$timeout" --head --fail "$url" > /dev/null 2>&1; then
        return 0
    else
        return 1
    fi
}

# Function to download file
download_file() {
    local url="$1"
    local output_file="$2"

    echo -e "${BLUE}📥 Downloading: $url${NC}"
    if curl -s --max-time 30 --fail -o "$output_file" "$url"; then
        echo -e "${GREEN}✅ Downloaded: $output_file${NC}"
        return 0
    else
        echo -e "${RED}❌ Failed to download: $url${NC}"
        return 1
    fi
}

# Create output directory
mkdir -p ./weavy_sources

echo -e "\n${YELLOW}🦀 Checking for Rust source files...${NC}"

rust_found=0
for base_path in "${BASE_PATHS[@]}"; do
    for rust_file in "${RUST_FILES[@]}"; do
        full_url="$base_path/$rust_file"

        if check_url "$full_url"; then
            echo -e "${GREEN}🎉 Found Rust file: $full_url${NC}"
            download_file "$full_url" "./weavy_sources/$(basename "$rust_file")"
            ((rust_found++))
        fi

        # Small delay to avoid overwhelming server
        sleep 0.1
    done
done

echo -e "\n${YELLOW}🔧 Checking for build files...${NC}"

build_found=0
for base_path in "${BASE_PATHS[@]}"; do
    for build_file in "${BUILD_FILES[@]}"; do
        full_url="$base_path/$build_file"

        if check_url "$full_url"; then
            echo -e "${GREEN}🔧 Found build file: $full_url${NC}"
            download_file "$full_url" "./weavy_sources/$(basename "$build_file")"
            ((build_found++))
        fi

        sleep 0.1
    done
done

echo -e "\n${YELLOW}🗺️  Checking for source maps...${NC}"

# Get main page and extract asset URLs
echo -e "${BLUE}📄 Fetching main page to find assets...${NC}"
main_page=$(curl -s --max-time 10 "$FLOW_URL")

# Extract JavaScript and CSS files
asset_urls=$(echo "$main_page" | grep -oE '(src|href)="[^"]*\.(js|css|wasm)"' | sed 's/.*="\(.*\)"/\1/' | sort | uniq)

maps_found=0
for asset_url in $asset_urls; do
    # Convert relative URLs to absolute
    if [[ $asset_url == /* ]]; then
        full_asset_url="$BASE_URL$asset_url"
    elif [[ $asset_url == http* ]]; then
        full_asset_url="$asset_url"
    else
        full_asset_url="$FLOW_URL/$asset_url"
    fi

    # Check for .map files
    map_url="${full_asset_url}.map"
    if check_url "$map_url"; then
        echo -e "${GREEN}🗺️  Found source map: $map_url${NC}"
        download_file "$map_url" "./weavy_sources/$(basename "$asset_url").map"
        ((maps_found++))
    fi

    sleep 0.1
done

# Summary
echo -e "\n${BLUE}"'='*.repeat(50)"${NC}"
echo -e "${BLUE}📊 DISCOVERY SUMMARY${NC}"
echo -e "${BLUE}"'='*.repeat(50)"${NC}"

echo -e "\n${GREEN}🦀 Rust Files Found: $rust_found${NC}"
echo -e "${GREEN}🔧 Build Files Found: $build_found${NC}"
echo -e "${GREEN}🗺️  Source Maps Found: $maps_found${NC}"

if [ -d "./weavy_sources" ] && [ "$(ls -A ./weavy_sources)" ]; then
    echo -e "\n${GREEN}📁 Downloaded files saved to: ./weavy_sources/${NC}"
    echo -e "${BLUE}Contents:${NC}"
    ls -la ./weavy_sources/
else
    echo -e "\n${YELLOW}📁 No files were downloaded${NC}"
fi

echo -e "\n${YELLOW}💡 Tips:${NC}"
echo -e "  - Run this script while logged into Weavy for better results"
echo -e "  - Check ./weavy_sources/ for downloaded files"
echo -e "  - Use browser dev tools Network tab for more detailed discovery"
echo -e "  - Look for additional Rust files in subdirectories"

echo -e "\n${GREEN}✅ Discovery complete!${NC}"
