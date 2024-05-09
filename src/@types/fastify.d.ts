import "fatify"

declare module "fastify" {
  export interface FastifyRequest {
    getCurrentUser(): Promise<string>
  }
}
