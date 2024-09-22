/* SPDX: Apache-2.0
 */
import * as esbuild from "esbuild";
import fs from "node:fs/promises";
import path from "node:path";

export type GjsPluginOpts = {
  /**
   * Builtin modules are the modules provided by gjs. By default it's cairo, gettext,
   * package.js and system.
   *
   * Use this field to override.
   */
  builtinModules?: string[];
  /**
   * Writing resource manifest.
   *
   * Resource manifests can be used to bundle files using `glib-compile-resources`.
   */
  writeResourceManifest?: {
    /**
     * The resource prefix, like /org/example/MyApp.
     *
     * This is the prefix for all files.
     */
    prefix: string;
    /**
     * The manifest filename.
     *
     * The file is placed under the `outdir` or the same directory of the `outfile`.
     */
    filename: string;
  };
};

export const BUILDIN_MODULES_DEFAULT = [
  "cairo",
  "gettext",
  "package.js",
  "system",
];

type ResourceItem = {
  path: string;
  alias: string;
};

function* generateResourceManifest(resources: Map<string, ResourceItem[]>) {
  yield `<?xml version="1.0" encoding="UTF-8"?>`;
  yield `<gresources>`;
  for (const [prefix, items] of resources.entries()) {
    yield `<gresource prefix="${prefix}">`;
    for (const { path, alias } of items) {
      yield `<file alias="${alias}">${path}</file>`;
    }
    yield `</gresource>`;
  }
  yield `</gresources>`;
}

export default function ({
  builtinModules = BUILDIN_MODULES_DEFAULT,
  writeResourceManifest,
}: GjsPluginOpts) {
  return {
    name: "gjs",
    setup: function (build: esbuild.PluginBuild): void | Promise<void> {
      const opts = build.initialOptions;
      if (!opts.format) {
        opts.format = "esm";
      }

      if (writeResourceManifest) {
        opts.metafile = true;

        build.onEnd(async (result) => {
          const metafile = result.metafile;
          if (!metafile) throw new Error("unreachable");

          const resources = new Map<string, ResourceItem[]>();
          const files = [] as ResourceItem[];
          resources.set(writeResourceManifest.prefix, files);

          for (const path of Object.keys(metafile.outputs)) {
            files.push({ path, alias: path });
          }

          const text = Array.from(generateResourceManifest(resources)).join(
            "\n"
          );
          const parentPath =
            opts.outdir ?? (opts.outfile ? path.dirname(opts.outfile) : ".");
          const manifestPath = path.join(
            parentPath,
            writeResourceManifest.filename
          );

          try {
            await fs.writeFile(manifestPath, text, {
              encoding: "utf-8",
              flag: "w+",
            });
          } catch (err) {
            return {
              errors: [
                {
                  text: `failed to write resource manifest`,
                  detail: err,
                  notes: [
                    {
                      text: `writing content into "${manifestPath}"`,
                    },
                  ],
                },
              ],
            };
          }
        });
      }

      build.onResolve({ filter: /^gi:/ }, () => ({
        external: true,
        namespace: "gjs",
        sideEffects: false,
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
          sideEffects: false,
        }));
      }
    },
  } as esbuild.Plugin;
}
