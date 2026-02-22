import "@testing-library/jest-dom/vitest";
import { vi } from "vitest";

// ---- TextEncoder/TextDecoder (often needed by react-router / some libs) ----
import { TextDecoder, TextEncoder } from "util";

if (!globalThis.TextEncoder) {
    // @ts-expect-error - polyfill
    globalThis.TextEncoder = TextEncoder;
}
if (!globalThis.TextDecoder) {
    // @ts-expect-error - polyfill
    globalThis.TextDecoder = TextDecoder;
}

// ---- matchMedia (often needed by UI libs) ----
if (!window.matchMedia) {
    window.matchMedia = (query: string) =>
        ({
            matches: false,
            media: query,
            onchange: null,
            addListener: vi.fn(), // deprecated
            removeListener: vi.fn(), // deprecated
            addEventListener: vi.fn(),
            removeEventListener: vi.fn(),
            dispatchEvent: vi.fn(),
        }) as any;
}

// ---- ResizeObserver (charts/layout libs) ----
if (!(globalThis as any).ResizeObserver) {
    (globalThis as any).ResizeObserver = class ResizeObserver {
        observe() { }
        unobserve() { }
        disconnect() { }
    };
}

// ---- IntersectionObserver (lazy loading, infinite scroll, etc.) ----
if (!(globalThis as any).IntersectionObserver) {
    (globalThis as any).IntersectionObserver = class IntersectionObserver {
        constructor() { }
        observe() { }
        unobserve() { }
        disconnect() { }
    };
}

// ---- scrollTo (some pages call it) ----
if (!window.scrollTo) {
    window.scrollTo = vi.fn();
}