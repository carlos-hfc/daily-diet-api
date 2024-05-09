import { execSync } from "node:child_process"

import supertest from "supertest"
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest"

import { app } from "../src/app"

describe("Users routes", () => {
  beforeAll(async () => {
    await app.ready()
  })

  afterAll(async () => {
    await app.close()
  })

  beforeEach(() => {
    execSync("npm run knex migrate:rollback --all")
    execSync("npm run knex migrate:latest")
  })

  it("should be able to create an user", async () => {
    await supertest(app.server)
      .post("/users")
      .send({
        name: "John Doe",
        email: "john.doe@email.com",
        password: "123456789",
      })
      .expect(201)
  })

  it("should not be able to create an user with same e-mail", async () => {
    await supertest(app.server)
      .post("/users")
      .send({
        name: "John Doe",
        email: "john.doe@email.com",
        password: "123456789",
      })
      .expect(201)

    await supertest(app.server)
      .post("/users")
      .send({
        name: "John Doe",
        email: "john.doe@email.com",
        password: "123456789",
      })
      .expect(400)
  })

  it("should be able to get profile user", async () => {
    await supertest(app.server)
      .post("/users")
      .send({
        name: "John Doe",
        email: "john.doe@email.com",
        password: "123456789",
      })
      .expect(201)

    const loginResponse = await supertest(app.server).post("/auth/login").send({
      email: "john.doe@email.com",
      password: "123456789",
    })

    const cookies = loginResponse.get("Set-Cookie") as string[]

    const userResponse = await supertest(app.server)
      .get("/users/profile")
      .set("Cookie", cookies)
      .expect(200)

    expect(userResponse.body.user).toEqual(
      expect.objectContaining({
        email: "john.doe@email.com",
        password: "123456789",
      }),
    )
  })
})
