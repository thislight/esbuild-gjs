/* SPDX: Apache-2.0
*/
import * as esbuild from "esbuild";


export type GjsPluginOpts = {
  builtinModules?: string[];
};

export const BUILDIN_MODULES_DEFAULT = [
  "cairo",
  "gettext",
  "package.js",
  "system",
];

export default function ({
  builtinModules = BUILDIN_MODULES_DEFAULT,
}: GjsPluginOpts) {
  return {
    name: "gjs",
    setup: function (build: esbuild.PluginBuild): void | Promise<void> {
      const opts = build.initialOptions;
      if (!opts.format) {
        opts.format = "esm";
      }

      build.onResolve({ filter: /^gi:/ }, () => ({
        external: true,
        namespace: "gjs",
      }));

      build.onResolve({ filter: /^(file)|(resource):/ }, () => ({
        external: true,
        namespace: "gjs-file",
      }));

      if (builtinModules.length > 0) {
        const regex = new RegExp(
          `^${builtinModules.map((name) => `(${name})`).join("|")}$`
        );
        build.onResolve({ filter: regex }, () => ({
          external: true,
          namespace: "gjs",
        }));
      }
    },
  } as esbuild.Plugin;
}
