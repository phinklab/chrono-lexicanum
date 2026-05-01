// Demo file for the CI red-path smoke test (Session 014).
// This branch is intentionally NOT merged. tsc --noEmit fails on the
// type mismatch below, which proves the CI workflow correctly blocks
// merges with broken types.
const x: number = "this is a string, not a number";
export { x };
