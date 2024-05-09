import type { FastifyReply, FastifyRequest } from "fastify"

import { knex } from "../database"
import { checkSessionId } from "./check-session-id"

export async function getCurrentUser(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  await checkSessionId(request, reply)

  const { sessionId } = request.cookies

  const user = await knex("users").where({ sessionId }).first()

  if (!user) {
    return reply.code(400).send({
      message: "Invalid user",
    })
  }

  request.getCurrentUser = async () => {
    return user.id
  }
}
