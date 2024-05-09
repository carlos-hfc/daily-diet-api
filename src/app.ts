import fastifyCookie from "@fastify/cookie"
import fastify from "fastify"

import { authRoutes } from "./routes/auth"
import { mealsRoutes } from "./routes/meals"
import { usersRoutes } from "./routes/users"

export const app = fastify()

app.register(fastifyCookie)

app.register(usersRoutes, { prefix: "/users" })
app.register(authRoutes, { prefix: "/auth" })
app.register(mealsRoutes, { prefix: "/meals" })
