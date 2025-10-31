/**
 * Weavy Rust Source Finder - Browser Console Script
 *
 * Run this in the browser console on https://app.weavy.ai/flow/i1duC9kjnRBvtFTQrecSqh
 * after logging in to discover Rust source files, source maps, and build artifacts.
 */

(function() {
    'use strict';

    console.log('🚀 WEAVY RUST SOURCE DISCOVERY TOOL');
    console.log('=====================================');

    // Configuration
    const BASE_URL = 'https://app.weavy.ai';
    const RUST_FILES = [
        'Cargo.toml', 'Cargo.lock', 'src/lib.rs', 'src/main.rs',
        'src/graph.rs', 'src/renderer.rs', 'src/node.rs', 'src/webgl.rs',
        'src/shader.rs', 'src/wasm.rs', 'src/render.rs', 'src/pipeline.rs',
        'src/compositor.rs', 'src/material.rs', 'src/texture.rs',
        'src/buffer.rs', 'src/program.rs', 'src/uniform.rs',
        'build.rs', 'README.md', 'rust-toolchain.toml', 'rust-toolchain',
        '.cargo/config.toml'
    ];

    const BUILD_FILES = [
        'package.json', 'webpack.config.js', 'vite.config.js',
        'rollup.config.js', 'tsconfig.json', 'wrangler.toml',
        'wrangler.json', 'turbo.json', 'babel.config.js',
        'Makefile', '.gitignore', '.env', '.env.local',
        'Dockerfile', 'docker-compose.yml'
    ];

    const SOURCE_MAP_EXTENSIONS = ['.js.map', '.wasm.map', '.css.map'];

    // Results tracking
    const results = {
        rustFiles: [],
        sourceMaps: [],
        buildFiles: [],
        allAssets: new Set(),
        checkedUrls: new Set()
    };

    // Utility functions
    function delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async function checkUrl(url, timeout = 5000) {
        if (results.checkedUrls.has(url)) {
            return false;
        }
        results.checkedUrls.add(url);

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), timeout);

            const response = await fetch(url, {
                method: 'HEAD',
                signal: controller.signal,
                credentials: 'include' // Include cookies for auth
            });

            clearTimeout(timeoutId);
            return response.ok;
        } catch (e) {
            return false;
        }
    }

    async function discoverAssets() {
        console.log('🔍 Discovering assets from current page...');

        // Get all script, link, and asset URLs from the DOM
        const selectors = [
            'script[src]',
            'link[href]',
            'source[src]',
            'img[src]',
            'iframe[src]',
            'video[src]',
            'audio[src]'
        ];

        selectors.forEach(selector => {
            document.querySelectorAll(selector).forEach(element => {
                const attr = element.src ? 'src' : 'href';
                const url = element[attr];
                if (url) {
                    results.allAssets.add(url);
                }
            });
        });

        // Also check for sourceMappingURL comments
        const scripts = document.querySelectorAll('script');
        scripts.forEach(script => {
            if (script.textContent) {
                const sourceMapMatch = script.textContent.match(/\/\/# sourceMappingURL=(.+)/);
                if (sourceMapMatch) {
                    results.allAssets.add(sourceMapMatch[1]);
                }
            }
        });

        console.log(`📋 Found ${results.allAssets.size} asset URLs`);
    }

    async function checkRustFiles() {
        console.log('🦀 Checking for Rust source files...');

        const basePaths = [
            BASE_URL,
            `${BASE_URL}/`,
            `${BASE_URL}/src`,
            `${BASE_URL}/src/`,
            `${BASE_URL}/designer`,
            `${BASE_URL}/designer/`,
            `${BASE_URL}/rust`,
            `${BASE_URL}/rust/`,
            `${BASE_URL}/wasm`,
            `${BASE_URL}/wasm/`,
            `${BASE_URL}/core`,
            `${BASE_URL}/core/`,
            window.location.href
        ];

        for (const basePath of basePaths) {
            for (const rustFile of RUST_FILES) {
                const fullUrl = new URL(rustFile, basePath).href;

                if (await checkUrl(fullUrl)) {
                    results.rustFiles.push(fullUrl);
                    console.log(`🎉 Found Rust file: ${fullUrl}`);
                }

                // Small delay to avoid overwhelming the server
                await delay(100);
            }
        }
    }

    async function checkBuildFiles() {
        console.log('🔧 Checking for build files...');

        const basePaths = [
            BASE_URL,
            `${BASE_URL}/`,
            window.location.href.replace(/\/[^\/]*$/, '/'),
            window.location.href
        ];

        for (const basePath of basePaths) {
            for (const buildFile of BUILD_FILES) {
                const fullUrl = new URL(buildFile, basePath).href;

                if (await checkUrl(fullUrl)) {
                    results.buildFiles.push(fullUrl);
                    console.log(`🔧 Found build file: ${fullUrl}`);
                }

                await delay(100);
            }
        }
    }

    async function checkSourceMaps() {
        console.log('🗺️  Checking for source maps...');

        for (const assetUrl of results.allAssets) {
            for (const ext of SOURCE_MAP_EXTENSIONS) {
                if (assetUrl.endsWith(ext.replace('.map', ''))) {
                    const mapUrl = assetUrl + '.map';

                    if (await checkUrl(mapUrl)) {
                        results.sourceMaps.push(mapUrl);
                        console.log(`🗺️  Found source map: ${mapUrl}`);
                    }
                }
            }

            await delay(50);
        }
    }

    async function downloadFile(url, filename = null) {
        try {
            console.log(`📥 Downloading: ${url}`);
            const response = await fetch(url, { credentials: 'include' });
            const blob = await response.blob();

            // Create download link
            const downloadUrl = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = downloadUrl;
            a.download = filename || url.split('/').pop();
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(downloadUrl);

            console.log(`✅ Downloaded: ${filename || url.split('/').pop()}`);
        } catch (e) {
            console.error(`❌ Failed to download ${url}:`, e);
        }
    }

    async function runDiscovery() {
        try {
            await discoverAssets();
            await checkBuildFiles();
            await checkRustFiles();
            await checkSourceMaps();

            // Report results
            console.log('\n' + '='.repeat(50));
            console.log('📊 DISCOVERY RESULTS');
            console.log('='.repeat(50));

            console.log(`\n🦀 Rust Source Files (${results.rustFiles.length}):`);
            results.rustFiles.forEach(file => console.log(`  ✅ ${file}`));

            console.log(`\n🗺️  Source Maps (${results.sourceMaps.length}):`);
            results.sourceMaps.forEach(file => console.log(`  ✅ ${file}`));

            console.log(`\n🔧 Build Files (${results.buildFiles.length}):`);
            results.buildFiles.forEach(file => console.log(`  ✅ ${file}`));

            console.log(`\n📋 All Assets Found: ${results.allAssets.size}`);

            // Store results globally for manual access
            window.weavyDiscoveryResults = results;

            // Offer download option
            if (results.rustFiles.length > 0 || results.sourceMaps.length > 0 || results.buildFiles.length > 0) {
                console.log('\n💡 Download found files? Run: downloadFoundFiles()');

                window.downloadFoundFiles = async function() {
                    const allFiles = [...results.rustFiles, ...results.sourceMaps, ...results.buildFiles];
                    for (const url of allFiles) {
                        await downloadFile(url);
                        await delay(1000); // Delay between downloads
                    }
                };
            }

        } catch (error) {
            console.error('❌ Discovery failed:', error);
        }
    }

    // Auto-run the discovery
    console.log('🚀 Starting discovery... (this may take a few minutes)');
    runDiscovery();

})();
