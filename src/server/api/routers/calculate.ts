import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { products, processors } from "~/server/types";
import calculate from "~/utils/calculate";


export const calculateRouter = createTRPCRouter({
  calculate: publicProcedure
    .input(z.object({
      products,
      processors,
    }))
    .query(({ input: { products, processors }}) => {
      return calculate(products, processors);
    }),
});
