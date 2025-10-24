import { z } from "zod";

const brokerValidator = z.object({
  name: z
    .string()
    .describe(
      "The full name of the broker that can be found in the correspondence document, which is usually an email. Look for the name in the either the email header (From:) in the Signature.",
    ),
  email: z
    .string()
    .email()
    .describe(
      "The email address of the broker that can be found in the correspondence document, which is usually an email. Look for the email address in the either the email header (From:) in the Signature.",
    ),
  phone: z
    .string()
    .optional()
    .describe(
      "The phone number of the broker that can be found in the correspondence document, which is usually an email.",
    ),

  // Broker address section
  inCareOfName: z
    .string()
    .optional()
    .describe(
      "The 'in care of' name for the brokerage address, typically used when the address is associated with a specific person or department within the brokerage firm.",
    ),
  streetAddress: z
    .string()
    .optional()
    .describe(
      "The primary street address of the brokerage firm, including street number and street name. This is a required component for a complete brokerage address.",
    ),
  unitType: z
    .string()
    .optional()
    .describe(
      "The type of unit within the building (e.g., 'Suite', 'Unit', 'Floor', 'Room', 'Apt') that specifies the location within the street address.",
    ),
  unitNumber: z
    .string()
    .optional()
    .describe(
      "The specific unit number, suite number, or floor designation within the building at the street address.",
    ),
  cityTown: z
    .string()
    .optional()
    .describe(
      "The city or town where the brokerage firm is located. This is a required component for a complete brokerage address.",
    ),
  state: z
    .string()
    .optional()
    .describe(
      "The state, province, or region where the brokerage firm is located. Required for US addresses and some international addresses.",
    ),
  zipCode: z
    .string()
    .optional()
    .describe(
      "The ZIP code for US addresses or similar postal code format for the brokerage firm's location.",
    ),
  province: z
    .string()
    .optional()
    .describe(
      "The province, state, or administrative region for international addresses, particularly for Canadian addresses or other countries that use province terminology.",
    ),
  postalCode: z
    .string()
    .optional()
    .describe(
      "The postal code for international addresses, particularly for Canadian, UK, and other international postal systems.",
    ),
  country: z
    .string()
    .optional()
    .describe(
      "The country where the brokerage firm is located. May be explicitly stated or inferred from other address components.",
    ),
});

type BrokerDTO = z.infer<typeof brokerValidator>;

export { brokerValidator, type BrokerDTO };
