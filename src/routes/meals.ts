import { randomUUID } from "node:crypto"

import type { FastifyInstance } from "fastify"
import { z } from "zod"

import { knex } from "../database"
import { getCurrentUser } from "../middlewares/get-current-user"
import { convertHoursToMinutes } from "../utils/convertHoursToMinutes"

export async function mealsRoutes(app: FastifyInstance) {
  app.addHook("preHandler", getCurrentUser)

  app.post("/", async (request, reply) => {
    const bodySchema = z.object({
      name: z.string(),
      description: z.string(),
      date: z.string(),
      hour: z.string(),
      isOnADiet: z.boolean(),
    })

    const { date, description, hour, isOnADiet, name } = bodySchema.parse(
      request.body,
    )

    const userId = await request.getCurrentUser()

    await knex("meals").insert({
      id: randomUUID(),
      date,
      hour: convertHoursToMinutes(hour),
      description,
      isOnADiet,
      name,
      userId,
    })

    reply.code(201).send()
  })

  app.get("/", async (request, reply) => {
    const userId = await request.getCurrentUser()

    const meals = await knex("meals").where({ userId }).select()

    return reply.code(200).send({ meals })
  })

  app.get("/:id", async (request, reply) => {
    const paramsSchema = z.object({
      id: z.string().uuid(),
    })

    const { id } = paramsSchema.parse(request.params)

    const userId = await request.getCurrentUser()

    const meal = await knex("meals").where({ userId, id }).first()

    if (!meal) {
      return reply.code(404).send({
        message: "Meal not found.",
      })
    }

    return reply.code(200).send({ meal })
  })

  app.put("/:id", async (request, reply) => {
    const paramsSchema = z.object({
      id: z.string().uuid(),
    })

    const { id } = paramsSchema.parse(request.params)

    const bodySchema = z.object({
      name: z.string().optional(),
      description: z.string().optional(),
      date: z.string().optional(),
      hour: z.string().optional(),
      isOnADiet: z.boolean().optional(),
    })

    const { date, description, hour, isOnADiet, name } = bodySchema.parse(
      request.body,
    )

    const userId = await request.getCurrentUser()

    const meal = await knex("meals").where({ userId, id }).first()

    if (!meal) {
      return reply.code(404).send({
        message: "Meal not found.",
      })
    }

    await knex("meals")
      .where({ userId, id })
      .update({
        date: date ?? meal.date,
        description: description ?? meal.description,
        isOnADiet: isOnADiet ?? meal.isOnADiet,
        name: name ?? meal.name,
        hour: hour ? convertHoursToMinutes(hour) : meal.hour,
      })

    return reply.code(204).send()
  })

  app.delete("/:id", async (request, reply) => {
    const paramsSchema = z.object({
      id: z.string().uuid(),
    })

    const { id } = paramsSchema.parse(request.params)

    const userId = await request.getCurrentUser()

    const meal = await knex("meals").where({ id, userId }).first()

    if (!meal) {
      return reply.code(404).send({
        message: "Meal not found.",
      })
    }

    await knex("meals").where({ id, userId }).del()

    return reply.code(204).send()
  })

  app.get("/metrics", async (request, reply) => {
    const userId = await request.getCurrentUser()

    const [totalMeals, totalOnDietMeals, totalOffDietMeals] = await Promise.all(
      [
        knex("meals").where({ userId }).count("*", { as: "total" }).first(),
        knex("meals")
          .where({ userId, isOnADiet: true })
          .count("isOnADiet", { as: "total" })
          .first(),
        knex("meals")
          .where({ userId, isOnADiet: false })
          .count("isOnADiet", { as: "total" })
          .first(),
      ],
    )

    const sequence = await knex("meals")
      .where({ userId })
      .orderBy([
        { column: "date", order: "asc" },
        { column: "hour", order: "asc" },
      ])

    const { bestSequence } = sequence.reduce(
      (acc, cur) => {
        if (cur.isOnADiet) {
          acc.currentSequence += 1
        } else {
          acc.currentSequence = 0
        }

        if (acc.currentSequence > acc.bestSequence) {
          acc.bestSequence = acc.currentSequence
        }

        return acc
      },
      { bestSequence: 0, currentSequence: 0 },
    )

    return reply.code(200).send({
      totalMeals: totalMeals?.total,
      totalOffDietMeals: totalOffDietMeals?.total,
      totalOnDietMeals: totalOnDietMeals?.total,
      bestSequence,
    })
  })
}
