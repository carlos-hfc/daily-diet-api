import "knex"

declare module "knex/types/tables" {
  export interface Tables {
    users: {
      id: string
      name: string
      email: string
      password: string
      sessionId?: string
    }

    meals: {
      id: string
      name: string
      description: string
      date: string
      hour: number
      isOnADiet: boolean
      userId: string
    }
  }
}
