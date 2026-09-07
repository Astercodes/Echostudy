// Local fixture server for browser tests; these settings never enter normal builds.
const { spawn } = require("node:child_process");
const child = spawn(
  process.execPath,
  [
    "node_modules/vite/bin/vite.js",
    "--host",
    "127.0.0.1",
    "--port",
    "5180",
    "--strictPort",
  ],
  {
    stdio: "inherit",
    env: {
      ...process.env,
      VITE_SUPABASE_URL: "https://auth.echostudy.test",
      VITE_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_browser_test_only",
    },
  },
);
child.on("error", (error) => {
  console.error(error);
  process.exitCode = 1;
});
child.on("exit", (code) => {
  process.exitCode = code ?? 1;
});
