// jsdom is pinned to ^26 in package.json due to CJS/worker compatibility with
// Vitest 4 + Vite 8. jsdom 29 introduced a pure-ESM dependency that fails in
// vitest workers. Before upgrading, verify the worker resolution still works.
// jsdom 26 lacks setPointerCapture/releasePointerCapture — mock them in this
// file if pointer-event component tests need them.
import '@testing-library/jest-dom/vitest';
