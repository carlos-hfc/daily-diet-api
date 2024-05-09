import type { FastifyReply, FastifyRequest } from "fastify"

export async function checkSessionId(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { sessionId } = request.cookies

  if (!sessionId) {
    return reply.code(401).send({
      message: "Unauthorized",
    })
  }
}
