import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// https://vite.dev/config/
export default defineConfig({
	plugins: [
		react({
			jsxRuntime: 'automatic'
		})
	],
	resolve: {
		alias: {
			"@": path.resolve(process.cwd(), "./src"),
		},
	},
	optimizeDeps: {
		exclude: ['bippy']
	},
	esbuild: {
		jsx: 'automatic'
	}
});
