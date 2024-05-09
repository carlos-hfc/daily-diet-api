import { randomUUID } from "node:crypto"

import type { FastifyInstance } from "fastify"
import { z } from "zod"

import { knex } from "../database"

export async function authRoutes(app: FastifyInstance) {
  app.post("/login", async (request, reply) => {
    const bodySchema = z.object({
      email: z.string().email(),
      password: z.string(),
    })

    const { email, password } = bodySchema.parse(request.body)

    const user = await knex("users")
      .where({
        email,
        password,
      })
      .first()

    if (!user) {
      return reply.code(400).send({
        message: "Invalid credentials.",
      })
    }

    const sessionId = randomUUID()

    await knex("users")
      .update({
        sessionId,
      })
      .where("id", user.id)

    reply
      .code(200)
      .setCookie("sessionId", sessionId, {
        path: "/",
        httpOnly: true,
        maxAge: 60 * 60 * 24 * 7, // 7 days
      })
      .send()
  })
}
