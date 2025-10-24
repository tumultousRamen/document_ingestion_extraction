import { z } from "zod";

const brokerValidator = z.object({
  name: z.string(),
  email: z.string().email(),
  phone: z.string().optional(),
  inCareOfName: z.string().optional(),
  streetAddress: z.string().optional(),
  unitType: z.string().optional(),
  unitNumber: z.string().optional(),
  cityTown: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  province: z.string().optional(),
  postalCode: z.string().optional(),
  country: z.string().optional(),
});

type Broker = z.infer<typeof brokerValidator>;

export { brokerValidator, type Broker };
