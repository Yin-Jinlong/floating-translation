import {defineConfig} from 'vite'
import vue from '@vitejs/plugin-vue'
import {PreRenderedAsset} from "rollup";
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import {ElementPlusResolver} from 'unplugin-vue-components/resolvers'
import * as path from "path";

// https://vitejs.dev/config/
export default defineConfig({
    server: {
        port: 6699,
    },
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "./src"),
        }
    },
    build: {
        reportCompressedSize: false,
        minify: "terser",
        cssMinify: "lightningcss",
        rollupOptions: {
            input: [
                "index.html",
                "src/content.ts",
                "src/server.ts"
            ],
            output: {
                sanitizeFileName(fileName) {
                    return fileName.replace(/[^a-zA-Z0-9.-]/g, "");
                },
                chunkFileNames: "[name].js",
                entryFileNames: "[name].js",
                assetFileNames(chunkInfo: PreRenderedAsset) {
                    if (chunkInfo.name.endsWith(".css")) {
                        return "css/[name].css";
                    } else {
                        return "assets/[name][extname]"
                    }
                },
            }
        }
    },
    plugins: [
        vue(),
        AutoImport({
            resolvers: [ElementPlusResolver({
                importStyle: false,
            })],
        }),
        Components({
            resolvers: [ElementPlusResolver({
                importStyle: false
            })],
        }),
    ],
})
