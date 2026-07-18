import { existsSync } from "node:fs";
import { spawnSync } from "node:child_process";

function run(command, args) {
  console.log(`\n> ${command} ${args.join(" ")}`);
  const result = spawnSync(command, args, {
    stdio: "inherit",
    shell: process.platform === "win32",
  });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

const runtimePackages = [
  "@capacitor/core",
  "@capacitor/app",
  "@capacitor/browser",
  "@capacitor/camera",
  "@capacitor/device",
  "@capacitor/filesystem",
  "@capacitor/haptics",
  "@capacitor/keyboard",
  "@capacitor/network",
  "@capacitor/preferences",
  "@capacitor/push-notifications",
  "@capacitor/share",
  "@capacitor/splash-screen",
  "@capacitor/status-bar",
];

const developmentPackages = [
  "@capacitor/cli",
  "@capacitor/android",
  "@capacitor/ios",
  "@capacitor/assets",
];

console.log("RGNFIX mobil proje hazırlığı başlıyor…");
run("pnpm", ["add", ...runtimePackages]);
run("pnpm", ["add", "-D", ...developmentPackages]);
run("pnpm", ["run", "check"]);
run("pnpm", ["run", "build"]);

if (!existsSync("android")) run("pnpm", ["exec", "cap", "add", "android"]);
if (process.platform === "darwin" && !existsSync("ios")) {
  run("pnpm", ["exec", "cap", "add", "ios"]);
} else if (process.platform !== "darwin") {
  console.log("\niOS projesi yalnızca macOS üzerinde oluşturulabilir; Android hazırlığı devam ediyor.");
}

run("pnpm", ["exec", "cap", "sync"]);
run("pnpm", ["exec", "capacitor-assets", "generate", "--assetPath", "mobile/assets"]);

console.log("\nMobil hazırlık tamamlandı.");
console.log("Android Studio: pnpm exec cap open android");
if (process.platform === "darwin") console.log("Xcode: pnpm exec cap open ios");
