import { randomUUID } from "node:crypto"

import type { FastifyInstance } from "fastify"
import { z } from "zod"

import { knex } from "../database"
import { checkSessionId } from "../middlewares/check-session-id"

export async function usersRoutes(app: FastifyInstance) {
  app.post("/", async (request, reply) => {
    const bodySchema = z.object({
      name: z.string(),
      email: z.string().email(),
      password: z.string(),
    })

    const { name, email, password } = bodySchema.parse(request.body)

    const exists = await knex("users").where("email", email).first()

    if (exists) {
      return reply.code(400).send({
        message: "User already exists.",
      })
    }

    await knex("users").insert({
      id: randomUUID(),
      name,
      email,
      password,
    })

    reply.code(201).send()
  })

  app.get(
    "/profile",
    { preHandler: [checkSessionId] },
    async (request, reply) => {
      const { sessionId } = request.cookies

      const user = await knex("users")
        .where({
          sessionId,
        })
        .first()

      return reply.code(200).send({ user })
    },
  )
}
