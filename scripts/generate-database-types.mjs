import { readFileSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";

const command = process.platform === "win32" ? (process.env.ComSpec ?? "cmd.exe") : "npx";
const args = process.platform === "win32"
  ? ["/d", "/s", "/c", "npx supabase gen types typescript --local"]
  : ["supabase", "gen", "types", "typescript", "--local"];
const result = spawnSync(command, args, {
  encoding: "utf8",
});

if (result.error) throw result.error;
if (result.stderr) process.stderr.write(result.stderr);
if (result.status !== 0) process.exit(result.status ?? 1);

const generated = `${result.stdout.trimEnd()}\n`;
const destination = new URL("../src/types/database.types.ts", import.meta.url);
writeFileSync(destination, generated, "utf8");
if (readFileSync(destination, "utf8") !== generated) {
  throw new Error("Generated database types were not written exactly.");
}
