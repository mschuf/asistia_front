import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";
export default defineConfig({
    plugins: [react()],
    server: {
        proxy: {
            "/api": {
                target: "http://localhost:1001",
                changeOrigin: true
            }
        }
    },
    build: {
        rollupOptions: {
            output: {
                manualChunks: function (id) {
                    if (!id.includes("node_modules")) {
                        return undefined;
                    }
                    if (id.includes("recharts")) {
                        return "charts";
                    }
                    if (id.includes("@dnd-kit")) {
                        return "drag-drop";
                    }
                    if (id.includes("react-phone-number-input") || id.includes("libphonenumber-js")) {
                        return "phone";
                    }
                    return "vendor";
                }
            }
        }
    },
    resolve: {
        alias: {
            "@": fileURLToPath(new URL("./src", import.meta.url))
        }
    }
});
