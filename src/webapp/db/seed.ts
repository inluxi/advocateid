import { seedDemo, seedReference } from "./seed-run";

async function main() {
  const ref = await seedReference();
  console.log(`reference data ready (${ref.courts} courts)`);
  if (process.argv.includes("--demo") || process.env.SEED_DEMO === "1") {
    const demo = await seedDemo();
    console.log(`demo pages created: ${demo.pages}`);
  }
  process.exit(0);
}

main().catch((e) => {
  console.error("seed failed:", e instanceof Error ? e.message : "unknown error");
  process.exit(1);
});
