// ex. scripts/build_npm.ts
import { build } from "https://deno.land/x/dnt/mod.ts";
import {VERSION} from "../version.ts"

await build({
  entryPoints: ["./mod.ts"],
  outDir: "./npm",
  package: {
    // package.json properties
    name: "@chronark/env",
    version: VERSION,
    description:
      "Utility library to load and require environment variables to be set",
    license: "MIT",
    repository: {
      type: "git",
      url: "git+https://github.com/chronark/env.git",
    },
    bugs: {
      url: "https://github.com/chronark/env/issues",
    },
  },
});

// post build steps
Deno.copyFileSync("LICENSE", "npm/LICENSE");
Deno.copyFileSync("README.md", "npm/README.md");
