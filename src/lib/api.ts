/**
 * Minimal GraphQL client for athenaeum-service. In dev, Vite proxies /graphql
 * to the service (see vite.config.ts); set VITE_API_URL to point elsewhere.
 */
const API_URL = import.meta.env.VITE_API_URL ?? '/graphql'

export class ApiError extends Error {}

export async function gql<T>(query: string, variables?: Record<string, unknown>): Promise<T> {
  let response: Response
  try {
    response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ query, variables }),
    })
  } catch {
    throw new ApiError("Can't reach the Athenaeum service. Is it running? (cd service && npm run dev)")
  }

  let body: { data?: T; errors?: { message: string }[] }
  try {
    body = await response.json()
  } catch {
    throw new ApiError(`The Athenaeum service returned an unreadable response (${response.status}).`)
  }

  if (body.errors?.length) throw new ApiError(body.errors[0]!.message)
  if (!body.data) throw new ApiError(`The Athenaeum service returned no data (${response.status}).`)
  return body.data
}
