import { z } from 'zod';

export const UnitStatusEnum = z.enum(['AVAILABLE', 'RESERVED', 'SOLD']);

export const ApartmentUnitSchema = z.object({
  number: z.string().min(1),
  sizeSqm: z.coerce.number().positive(),
  floor: z.coerce.number().int(),
  rooms: z.coerce.number().int().positive(),
  price: z.coerce.number().int().nonnegative().optional(),
  orientation: z.string().optional(),
  status: UnitStatusEnum.default('AVAILABLE'),
});

export type ApartmentUnitInput = z.infer<typeof ApartmentUnitSchema>;

export const ProjectSchema = z.object({
  name: z.string().min(1),
  location: z.string().min(1),
  micrositeSlug: z.string().min(1),
  brandColor: z.string().optional(),
  description: z.string().optional(),
  units: z.array(ApartmentUnitSchema).min(1),
});

export type ProjectInput = z.infer<typeof ProjectSchema>;

export const LeadSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
  message: z.string().optional(),
  projectId: z.string().min(1),
  unitId: z.string().optional(),
});

export type LeadInput = z.infer<typeof LeadSchema>;
