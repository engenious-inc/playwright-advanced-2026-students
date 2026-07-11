/** Isolated mock host for the M06 routeWebSocket lesson — not a production anchor URL. */
export const mockWebSocketLesson = {
  pageUrl: 'http://mock.test/',
  wsUrl: 'ws://mock.test/ws',
  pageRoutePattern: 'http://mock.test/**',
} as const;
