import { execSync } from "node:child_process"

import supertest, { type Response } from "supertest"
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest"

import { app } from "../src/app"

let loggedUser: Response
let cookie: string[]

describe("Meals routes", () => {
  beforeAll(async () => {
    await app.ready()
  })

  afterAll(async () => {
    await app.close()
  })

  beforeEach(async () => {
    execSync("npm run knex migrate:rollback --all")
    execSync("npm run knex migrate:latest")

    await supertest(app.server)
      .post("/users")
      .send({
        name: "John Doe",
        email: "john.doe@email.com",
        password: "123456789",
      })
      .expect(201)

    loggedUser = await supertest(app.server).post("/auth/login").send({
      email: "john.doe@email.com",
      password: "123456789",
    })

    cookie = loggedUser.get("Set-Cookie") as string[]
  })

  it("should be able to create a meal", async () => {
    await supertest(app.server)
      .post("/meals")
      .set("Cookie", cookie)
      .send({
        date: "2024-05-01",
        hour: "10:00",
        description: "Lorem",
        isOnADiet: true,
        name: "Whey",
      })
      .expect(201)
  })

  it("should not be able to create a meal", async () => {
    await supertest(app.server)
      .post("/meals")
      .send({
        date: "2024-05-01",
        hour: "10:00",
        description: "Lorem",
        isOnADiet: true,
      })
      .expect(401)
  })

  it("should be able to list all meals", async () => {
    await supertest(app.server).post("/meals").set("Cookie", cookie).send({
      date: "2024-05-01",
      hour: "10:00",
      description: "Lorem",
      isOnADiet: true,
      name: "Whey",
    })

    const meals = await supertest(app.server)
      .get("/meals")
      .set("Cookie", cookie)
      .expect(200)

    expect(meals.body.meals).toEqual([
      expect.objectContaining({
        date: "2024-05-01",
        name: "Whey",
      }),
    ])
  })

  it("should be able to get a specific meal", async () => {
    await supertest(app.server).post("/meals").set("Cookie", cookie).send({
      date: "2024-05-01",
      hour: "10:00",
      description: "Lorem",
      isOnADiet: true,
      name: "Whey",
    })

    const meals = await supertest(app.server)
      .get("/meals")
      .set("Cookie", cookie)
      .expect(200)

    const mealId = meals.body.meals[0].id

    const getMeal = await supertest(app.server)
      .get(`/meals/${mealId}`)
      .set("Cookie", cookie)
      .expect(200)

    expect(getMeal.body.meal).toEqual(
      expect.objectContaining({
        date: "2024-05-01",
        name: "Whey",
      }),
    )
  })

  it("should be able to update a meal", async () => {
    await supertest(app.server).post("/meals").set("Cookie", cookie).send({
      date: "2024-05-01",
      hour: "10:00",
      description: "Lorem",
      isOnADiet: true,
      name: "Whey",
    })

    const meals = await supertest(app.server)
      .get("/meals")
      .set("Cookie", cookie)
      .expect(200)

    const mealId = meals.body.meals[0].id

    await supertest(app.server)
      .put(`/meals/${mealId}`)
      .set("Cookie", cookie)
      .send({
        name: "Sanduíche",
      })
      .expect(204)
  })

  it("should be able to delete a meal", async () => {
    await supertest(app.server).post("/meals").set("Cookie", cookie).send({
      date: "2024-05-01",
      hour: "10:00",
      description: "Lorem",
      isOnADiet: true,
      name: "Whey",
    })

    const meals = await supertest(app.server)
      .get("/meals")
      .set("Cookie", cookie)
      .expect(200)

    const mealId = meals.body.meals[0].id

    await supertest(app.server)
      .delete(`/meals/${mealId}`)
      .set("Cookie", cookie)
      .expect(204)
  })

  it("should be able to get metrics from user", async () => {
    await Promise.all([
      supertest(app.server).post("/meals").set("Cookie", cookie).send({
        date: "2024-05-01",
        hour: "10:00",
        description: "Lorem",
        isOnADiet: false,
        name: "Whey",
      }),
      supertest(app.server).post("/meals").set("Cookie", cookie).send({
        date: "2024-05-01",
        hour: "11:00",
        description: "Lorem",
        isOnADiet: true,
        name: "Whey",
      }),
      supertest(app.server).post("/meals").set("Cookie", cookie).send({
        date: "2024-05-01",
        hour: "12:00",
        description: "Lorem",
        isOnADiet: true,
        name: "Whey",
      }),
      supertest(app.server).post("/meals").set("Cookie", cookie).send({
        date: "2024-05-01",
        hour: "13:00",
        description: "Lorem",
        isOnADiet: true,
        name: "Whey",
      }),
      supertest(app.server).post("/meals").set("Cookie", cookie).send({
        date: "2024-05-01",
        hour: "14:00",
        description: "Lorem",
        isOnADiet: false,
        name: "Whey",
      }),
    ])

    const meals = await supertest(app.server)
      .get("/meals/metrics")
      .set("Cookie", cookie)
      .expect(200)

    expect(meals.body).toEqual(
      expect.objectContaining({
        totalMeals: 5,
        totalOffDietMeals: 2,
        totalOnDietMeals: 3,
        bestSequence: 3,
      }),
    )
  })
})
