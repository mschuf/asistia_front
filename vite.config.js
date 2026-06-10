/**
 * @file vite.config.ts
 * @description Configuración de Vite: proxy de API, alias `@`, code splitting y plugin React.
 */
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
                /**
                 * Asigna dependencias de `node_modules` a chunks nombrados para mejor caché.
                 * @param id - Ruta absoluta del módulo resuelto por Rollup.
                 * @returns Nombre del chunk manual o `undefined` para el chunk por defecto.
                 */
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
