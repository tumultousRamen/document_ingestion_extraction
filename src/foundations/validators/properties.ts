import { z } from "zod";
import { addressValidator } from "./address";

// Array schema for properties extracted from submission documents.
// Each element is a validated address describing a property location requesting coverage.
// Excludes brokerage mailing/office addresses and payment/remittance addresses.
const propertiesValidator = z
  .array(addressValidator)
  .describe(
    "An array of property addresses requesting insurance coverage. Do not include brokerage office or mailing addresses.",
  );

type PropertiesDTO = z.infer<typeof propertiesValidator>;

export { propertiesValidator, type PropertiesDTO };
