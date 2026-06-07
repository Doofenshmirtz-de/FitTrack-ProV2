import { vi } from 'vitest'

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// Mock navigator.onLine
Object.defineProperty(window.navigator, 'onLine', {
  writable: true,
  value: true,
})

// Mock BroadcastChannel
class MockBroadcastChannel {
  name: string
  onmessage: ((event: MessageEvent) => void) | null = null

  constructor(name: string) {
    this.name = name
  }

  postMessage(_message: unknown) {
    // Simulate broadcast
  }

  close() {
    // Cleanup
  }
}

Object.defineProperty(window, 'BroadcastChannel', {
  writable: true,
  value: MockBroadcastChannel,
})

// Mock crypto.randomUUID
Object.defineProperty(window, 'crypto', {
  writable: true,
  value: {
    randomUUID: () => 'test-uuid-1234',
    getRandomValues: (arr: Uint8Array) => arr,
  },
})

// Suppress console errors in tests (optional)
// console.error = () => {}
// console.warn = () => {}
