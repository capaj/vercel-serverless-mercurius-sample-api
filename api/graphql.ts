import { VercelRequest, VercelResponse } from '@vercel/node'
import dotenv from 'dotenv'
import fastify from 'fastify'
import mercurius from 'mercurius'
import faker from 'faker'
import mercuriusMetrics from 'mercurius-apollo-tracing'

import cors from 'fastify-cors'

dotenv.config()

export const app = fastify({ logger: true })

export const basicSchema = `
  type Post {
    title: String
    body: String
  }
  type Query {
    add(x: Int, y: Int): Int
    word: String
    throwErr: String
    post: Post!
  }
`

export const basicResolvers = {
  Query: {
    async add(_, { x, y }, { reply }) {
      reply.log.info('add called')
      return x + y
    },
    async post() {
      return {
        title: faker.lorem.sentence(),
        body: faker.lorem.paragraph(6)
      }
    },
    word() {
      return faker.lorem.word()
    },
    throwErr() {
      throw new Error('sample error')
    }
  }
}

app.register(cors) // you need this if you want to be able to add the server to apollo studio and get introspection working in the modal for adding new graph
app.register(mercurius, {
  schema: basicSchema,
  resolvers: basicResolvers,
  path: '/graphql',
  graphiql: true,
  prefix: '/api'
})

const apiKey: string = process.env.APOLLO_KEY as string

app.register(mercuriusMetrics, {
  apiKey,
  graphRef:
    process.env.APOLLO_GRAPH_ID + '@' + process.env.APOLLO_GRAPH_VARIANT,
  sendReportsImmediately: true
})

export default async (request: VercelRequest, response: VercelResponse) => {
  await app.ready()
  app.server.emit('request', request, response)
}
