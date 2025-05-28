import { build, context } from "esbuild";

const isWatch = process.argv.includes("--watch");
const isDev = process.argv.includes("--dev");

const config = {
  entryPoints: ["js/widget.ts"],
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
      console.log("✅ Build completed successfully");
    }
  } catch (error) {
    console.error("❌ Build failed:", error);
    process.exit(1);
  }
}

runBuild();
