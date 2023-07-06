# Gjs Plugin for ESBuild

This plugin configures [esbuild](https://esbuild.github.io/) to bundle files for [Gjs](https://gitlab.gnome.org/GNOME/gjs).

- Module names start with "gi:", "file:", "resource:" are externals
- [Built-in module names](https://gitlab.gnome.org/GNOME/gjs/-/blob/master/doc/Modules.md) are externals
- Output will be ES module if no specified
- Legacy import is unsupported

````ts
import * as esbuild from "esbuild";
import GjsPlugin from "esbuild-gjs";

await esbuild.build({
  entryPoints: ["index.ts"],
  target: "firefox68", // Spider Monkey 68
  bundle: true,
  outfile: "index.js",
  plugins: [GjsPlugin({})]
});
````

## License
SPDX: Apache-2.0

