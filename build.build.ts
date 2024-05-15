import fs from 'fs'

import vue from '@vitejs/plugin-vue'
import {PreRenderedAsset, rollup} from 'rollup'
import commonjs from '@rollup/plugin-commonjs'
import resolve from '@rollup/plugin-node-resolve'
import typescript from 'rollup-plugin-typescript2'
import {ElementPlusResolver} from 'unplugin-vue-components/resolvers'
import Components from 'unplugin-vue-components/vite'
import {build} from 'vite'

async function buildAll() {
    fs.rmSync('dist', {
        recursive: true,
        force: true
    })
    await buildPopup()
    await buildServer()
    await buildClient()
}


async function buildPopup() {
    process.chdir('src/popup')
    await build({
        publicDir: '../../public',
        build: {
            outDir: '../../dist',
            reportCompressedSize: false,
            minify: 'terser',
            cssMinify: 'lightningcss',
            rollupOptions: {
                output: {
                    sanitizeFileName(fileName) {
                        return fileName.replace(/[^a-zA-Z0-9.-]/g, '')
                    },
                    chunkFileNames: '[name].js',
                    entryFileNames: '[name].js',
                    assetFileNames(chunkInfo: PreRenderedAsset) {
                        if (chunkInfo.name.endsWith('.css')) {
                            return 'css/[name].css'
                        } else {
                            return 'assets/[name][extname]'
                        }
                    },
                }
            }
        },
        plugins: [
            vue(),
            Components({
                resolvers: [ElementPlusResolver({
                    importStyle: false
                })],
            }),
        ]
    })
    process.chdir('../../')
}


async function buildServer() {
    console.log('build server')
    let bundle = await rollup({
        input: 'src/server/index.ts',
        plugins: [
            typescript({
                check: false
            }),
            resolve(),
            commonjs(),
        ]
    })
    await bundle.write({
        file: 'dist/server.js',
        format: 'iife',
        sourcemap: false
    })
}


async function buildClient() {
    console.log('build client')
    process.chdir('src/client')
    await build({
        build: {
            outDir: '../../dist',
            reportCompressedSize: false,
            minify: 'terser',
            rollupOptions: {
                input: 'index.ts',
                output: {
                    format: 'iife',
                    entryFileNames: 'client.js',
                }
            }
        },
        plugins: [vue()]
    })

    process.chdir('../../')
}

buildAll().then().catch(e => {
    console.error(e)
    process.exit(1)
})
