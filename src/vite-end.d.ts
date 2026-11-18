/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** GraphQL endpoint; defaults to /graphql (proxied to the service in dev). */
  readonly VITE_API_URL?: string
}
