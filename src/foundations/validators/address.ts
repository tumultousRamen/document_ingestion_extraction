import { z } from "zod";

const addressValidator = z.object({
  inCareOfName: z.string().optional(),
  streetAddress: z.string(),
  unitType: z.string().optional(),
  unitNumber: z.string().optional(),
  cityTown: z.string(),
  state: z.string(),
  zipCode: z.string(),
  province: z.string().optional(),
  postalCode: z.string().optional(),
  country: z.string().optional(),
});

type Address = z.infer<typeof addressValidator>;

export { addressValidator, type Address };
