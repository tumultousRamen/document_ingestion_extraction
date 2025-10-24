import { z } from "zod";

const addressValidator = z.object({
  inCareOfName: z
    .string()
    .optional()
    .describe(
      "The 'in care of' name for the property address, typically used when the property is managed by a property management company, trust, or when the property is under a specific entity's name rather than an individual owner. This is common in commercial properties, rental properties, or properties held in trust.",
    ),
  streetAddress: z
    .string()
    .describe(
      "The complete street address of the property requesting insurance coverage, including the street number, street name, and any directional indicators (N, S, E, W). This is the primary identifier for the property location and is essential for catastrophe modeling and risk assessment. Must include both the numeric address and street name (e.g., '123 Main Street', '456 Oak Avenue NW').",
    ),
  unitType: z
    .string()
    .optional()
    .describe(
      "The type of unit or space within a building for the property address. Common values include 'Unit', 'Suite', 'Apt', 'Apartment', 'Floor', 'Level', 'Room', 'Office', 'Store', 'Shop', 'Warehouse', 'Bay', or 'Space'. This is particularly important for commercial properties, multi-unit buildings, condominiums, and office complexes where the specific unit designation is required for accurate property identification.",
    ),
  unitNumber: z
    .string()
    .optional()
    .describe(
      "The specific unit number, suite number, apartment number, floor designation, or space identifier within the building. This could be numeric (e.g., '101', 'Suite 200', 'Apt 3B', 'Floor 5', 'Unit 12A') or alphanumeric combinations. Critical for multi-unit properties, condominiums, office buildings, and commercial spaces where multiple units exist within the same street address.",
    ),
  cityTown: z
    .string()
    .describe(
      "The city, town, municipality, or incorporated area where the property is located. This is essential for geographic risk assessment, local building codes compliance, and catastrophe modeling. The city name should be the official municipal designation, not just a neighborhood or area name. Required for all property addresses as it determines local jurisdiction, building codes, and regional risk factors.",
    ),
  state: z
    .string()
    .describe(
      "The state, province, or administrative region where the property is located. This is critical for insurance underwriting as it determines state-specific regulations, building codes, natural disaster risk zones, and insurance requirements. Required for US properties and many international addresses. The state designation affects premium calculations, coverage availability, and regulatory compliance for the insurance policy.",
    ),
  zipCode: z
    .string()
    .describe(
      "The ZIP code for US properties or similar postal code format for the property's location. This 5-digit (or 9-digit with ZIP+4) code is essential for precise geographic location, risk zone determination, and catastrophe modeling. ZIP codes are used to assess flood zones, earthquake risk, hurricane exposure, and other location-specific perils that directly impact insurance pricing and coverage decisions.",
    ),
  province: z
    .string()
    .optional()
    .describe(
      "The province, state, or administrative region for international properties, particularly for Canadian properties, UK counties, or other countries that use province terminology. This field is used when the property is located outside the United States and the local addressing system uses province/state terminology. Important for international property insurance and cross-border risk assessment.",
    ),
  postalCode: z
    .string()
    .optional()
    .describe(
      "The postal code for international properties, particularly for Canadian properties (6-character format like 'K1A 0A6'), UK postcodes, Australian postcodes, or other international postal systems. This is essential for international property insurance, cross-border risk assessment, and accurate geographic location identification for properties outside the United States.",
    ),
  country: z
    .string()
    .optional()
    .describe(
      "The country where the property is located. While often inferred from other address components, this field is explicitly required for international properties and helps determine applicable insurance regulations, building codes, and risk assessment methodologies. Critical for cross-border insurance policies and international property coverage.",
    ),
});

type Address = z.infer<typeof addressValidator>;

export { addressValidator, type Address };
