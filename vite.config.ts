import path from "path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// Todos os arquivos estão na raiz do repositório: os caminhos "@/..." apontam para a raiz.
export default defineConfig({
  base: process.env.BASE_PATH ?? "/",
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: [
      { find: /^@\/(?:components\/ui|components|pages|hooks|lib)\//, replacement: path.resolve(__dirname) + "/" },
      { find: /^@\//, replacement: path.resolve(__dirname) + "/" },
    ],
  },
});
