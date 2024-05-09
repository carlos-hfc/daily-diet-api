import { execSync } from "node:child_process"

import supertest from "supertest"
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest"

import { app } from "../src/app"

describe("Auth routes", () => {
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

  it("should be able to login", async () => {
    await supertest(app.server)
      .post("/users")
      .send({
        name: "John Doe",
        email: "john.doe@email.com",
        password: "123456789",
      })
      .expect(201)

    const loginResponse = await supertest(app.server)
      .post("/auth/login")
      .send({
        email: "john.doe@email.com",
        password: "123456789",
      })
      .expect(200)

    expect(loginResponse.get("Set-Cookie")).toBeTruthy()
    expect(loginResponse.get("Set-Cookie")?.[0]).toContain("sessionId")
  })

  it("should not be able to login", async () => {
    await supertest(app.server)
      .post("/users")
      .send({
        name: "John Doe",
        email: "john.doe@email.com",
        password: "123456789",
      })
      .expect(201)

    const loginResponse = await supertest(app.server)
      .post("/auth/login")
      .send({
        email: "john@email.com",
        password: "123456789",
      })
      .expect(400)

    expect(loginResponse.body.message).toEqual("Invalid credentials.")
  })
})
