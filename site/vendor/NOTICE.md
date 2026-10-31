# Shader Sky

Uses the standalone engine distributed by radiumcoders / 23rd.dev.

Component: https://www.23rd.dev/docs/components/shader-sky

Source: https://github.com/radiumcoders/23rd.dev/tree/main/registry/shader-sky

The original TypeScript source is kept in `vendor-sources/shader-sky.ts`. The browser file is compiled with Node.js type stripping through `scripts/build-sky.mjs`. Integration changes reduce the maximum drawing resolution, request a low-power graphics context and add an explicit pause option. The component's original algorithm and authorship are retained. All runtime code is served with this site; no remote component scripts are loaded.
