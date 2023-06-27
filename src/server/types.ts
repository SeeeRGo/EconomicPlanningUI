import { z } from "zod";

export const products = z.array(z.object({
  id: z.string(),
  name: z.string(),
  demand: z.number(),
  objectiveWeight: z.number(),
}))

const productOutputs = z.array(z.object({
  productId: z.string(),
  productName: z.string(),
  output: z.number(),
}))

export const processors = z.array(z.object({
  id: z.string(),
  name: z.string(),
  avaliableTime: z.number(),
  productOutputs,
}))

const product = products.element
export type Product = z.infer<typeof product>

const processor = processors.element
export type Processor = z.infer<typeof processor>