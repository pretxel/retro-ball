// jest-dom 7 and jsdom 29 require Node.js 22, matching the project's runtime.
// Keep this Vitest-specific entrypoint so the matchers extend Vitest's expect.
import '@testing-library/jest-dom/vitest';
