import type { Knex } from "knex"

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("meals", table => {
    table.uuid("id").primary()
    table.string("name").notNullable()
    table.string("description").notNullable()
    table.string("date").notNullable()
    table.integer("hour").notNullable()
    table.boolean("isOnADiet").defaultTo(false)
    table.uuid("userId").notNullable()
    table.foreign("userId").references("id").inTable("users")
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable("meals")
}
