#!/usr/bin/env python3
"""
Weavy Rust Source Finder
Scans the live Weavy application for Rust source files, source maps, and build artifacts
"""

import requests
import json
import re
from urllib.parse import urljoin, urlparse
import time
from typing import Set, List, Dict
import os

class WeavySourceFinder:
    def __init__(self, base_url: str = "https://app.weavy.ai"):
        self.base_url = base_url
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
        })
        self.found_files: Set[str] = set()
        self.rust_files: List[str] = []
        self.source_maps: List[str] = []
        self.build_files: List[str] = []

    def discover_from_html(self, html_url: str) -> Set[str]:
        """Extract all asset URLs from HTML page"""
        try:
            response = self.session.get(html_url)
            response.raise_for_status()

            # Find all URLs in HTML
            urls = set()

            # Find script, link, and source map references
            patterns = [
                r'src=["\']([^"\']+)["\']',
                r'href=["\']([^"\']+)["\']',
                r'sourceMappingURL=([^"\s]+)',
                r'//# sourceMappingURL=([^"\s]+)'
            ]

            for pattern in patterns:
                matches = re.findall(pattern, response.text, re.IGNORECASE)
                for match in matches:
                    if match.startswith(('http://', 'https://', '//')):
                        urls.add(match)
                    elif match.startswith('/'):
                        urls.add(urljoin(self.base_url, match))
                    else:
                        urls.add(urljoin(html_url, match))

            return urls

        except Exception as e:
            print(f"Error discovering from HTML: {e}")
            return set()

    def check_rust_files(self, base_paths: List[str]) -> None:
        """Check for common Rust source file locations"""
        rust_extensions = ['.rs', '.toml', '.lock', '.md']
        rust_paths = [
            'Cargo.toml', 'Cargo.lock', 'src/lib.rs', 'src/main.rs',
            'src/graph.rs', 'src/renderer.rs', 'src/node.rs',
            'src/webgl.rs', 'src/shader.rs', 'src/wasm.rs',
            'build.rs', 'README.md', 'rust-toolchain.toml'
        ]

        for base_path in base_paths:
            for rust_file in rust_paths:
                full_url = urljoin(base_path, rust_file)
                if self.check_url_exists(full_url):
                    self.rust_files.append(full_url)
                    print(f"🎉 Found Rust file: {full_url}")

    def check_source_maps(self, asset_urls: Set[str]) -> None:
        """Check for source map files"""
        for asset_url in asset_urls:
            if asset_url.endswith('.js'):
                # Check for .js.map files
                map_url = asset_url + '.map'
                if self.check_url_exists(map_url):
                    self.source_maps.append(map_url)
                    print(f"🗺️  Found source map: {map_url}")

            elif asset_url.endswith('.wasm'):
                # Check for .wasm.map files
                map_url = asset_url + '.map'
                if self.check_url_exists(map_url):
                    self.source_maps.append(map_url)
                    print(f"🗺️  Found WASM source map: {map_url}")

    def check_build_artifacts(self, base_paths: List[str]) -> None:
        """Check for build configuration and artifact files"""
        build_files = [
            'package.json', 'webpack.config.js', 'vite.config.js',
            'tsconfig.json', 'wrangler.toml', 'wrangler.json',
            'build.rs', 'Makefile', '.gitignore', '.env'
        ]

        for base_path in base_paths:
            for build_file in build_files:
                full_url = urljoin(base_path, build_file)
                if self.check_url_exists(full_url):
                    self.build_files.append(full_url)
                    print(f"🔧 Found build file: {full_url}")

    def check_url_exists(self, url: str, timeout: int = 5) -> bool:
        """Check if URL exists without downloading full content"""
        try:
            response = self.session.head(url, timeout=timeout)
            return response.status_code == 200
        except:
            return False

    def download_file(self, url: str, output_path: str = None) -> bool:
        """Download a file if it exists"""
        try:
            response = self.session.get(url, timeout=10)
            response.raise_for_status()

            if output_path is None:
                filename = url.split('/')[-1]
                output_path = f"./downloaded/{filename}"

            os.makedirs(os.path.dirname(output_path), exist_ok=True)

            with open(output_path, 'wb') as f:
                f.write(response.content)

            print(f"📥 Downloaded: {url} -> {output_path}")
            return True

        except Exception as e:
            print(f"❌ Failed to download {url}: {e}")
            return False

    def scan_weavy_app(self) -> Dict:
        """Main scanning function"""
        print("🔍 Starting Weavy source discovery...")
        print(f"📍 Target: {self.base_url}")

        # Main flow URL
        flow_url = f"{self.base_url}/flow/i1duC9kjnRBvtFTQrecSqh"

        # Base paths to check
        base_paths = [
            self.base_url,
            f"{self.base_url}/",
            flow_url,
            f"{self.base_url}/assets/",
            f"{self.base_url}/src/",
            f"{self.base_url}/designer/",
        ]

        print("\n🔎 Discovering assets from HTML...")
        asset_urls = self.discover_from_html(flow_url)
        print(f"📋 Found {len(asset_urls)} asset URLs")

        print("\n🔧 Checking for build files...")
        self.check_build_artifacts(base_paths)

        print("\n🦀 Checking for Rust source files...")
        self.check_rust_files(base_paths)

        print("\n🗺️  Checking for source maps...")
        self.check_source_maps(asset_urls)

        # Report findings
        results = {
            'rust_files': self.rust_files,
            'source_maps': self.source_maps,
            'build_files': self.build_files,
            'all_assets': list(asset_urls)
        }

        return results

def main():
    finder = WeavySourceFinder()

    print("🚀 WEAVY RUST SOURCE DISCOVERY TOOL")
    print("=" * 50)

    results = finder.scan_weavy_app()

    print("\n" + "=" * 50)
    print("📊 DISCOVERY RESULTS")
    print("=" * 50)

    print(f"\n🦀 Rust Source Files ({len(results['rust_files'])}):")
    for file in results['rust_files']:
        print(f"  ✅ {file}")

    print(f"\n🗺️  Source Maps ({len(results['source_maps'])}):")
    for file in results['source_maps']:
        print(f"  ✅ {file}")

    print(f"\n🔧 Build Files ({len(results['build_files'])}):")
    for file in results['build_files']:
        print(f"  ✅ {file}")

    print("
💡 TIP: Run with authentication cookies for better results"    print("💡 Use browser dev tools Network tab for manual discovery"
    # Offer to download found files
    if results['rust_files'] or results['source_maps'] or results['build_files']:
        print("
🔄 Download found files? (y/n): "        if input().lower().startswith('y'):
            os.makedirs('./downloaded', exist_ok=True)
            for file_list in [results['rust_files'], results['source_maps'], results['build_files']]:
                for url in file_list:
                    finder.download_file(url)

if __name__ == "__main__":
    main()
