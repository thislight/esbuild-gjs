import * as esbuild from "esbuild";
import GjsPlugin from "esbuild-gjs";

await esbuild.build({
  entryPoints: ["index.ts"],
  target: "firefox68", // Spider Monkey 68
  bundle: true,
  outfile: "dist/index.js",
  plugins: [GjsPlugin({
    writeResourceManifest: {
      prefix: "/org/example/MyApp",
      filename: "org.example.MyApp.src.gresource.xml",
    }
  })]
});
