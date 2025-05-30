import { build, context } from "esbuild";
import { cp } from "fs/promises";
import { join } from "path";

const isWatch = process.argv.includes("--watch");
const isDev = process.argv.includes("--dev");

const config = {
  entryPoints: ["frontend/control_widget.ts", "frontend/video_widget.ts"],
  bundle: true,
  minify: !isDev,
  format: "esm",
  outdir: "src/aligned_widgets/static",
  loader: {
    ".html": "text",
    ".css": "css",
  },
  target: "es2020",
  sourcemap: isDev ? "inline" : false,
};

const staticSrc = "frontend/static";
const staticDest = "src/aligned_widgets/static";

async function runBuild() {
  try {
    if (isWatch) {
      const ctx = await context(config);
      await ctx.watch();
      console.log("👀 Watching for changes...");

      // Keep the process alive
      process.on("SIGINT", async () => {
        await ctx.dispose();
        process.exit(0);
      });
    } else {
      await build(config);
      await cp(staticSrc, staticDest, { recursive: true });
      console.log("✅ Build completed successfully");
    }
  } catch (error) {
    console.error("❌ Build failed:", error);
    process.exit(1);
  }
}

runBuild();
