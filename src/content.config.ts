import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const companyCollection = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/company' }),
  schema: z.object({
    title: z.string(),
    tagline: z.string().optional(),
    weight: z.number().optional(),
    logo: z.string().optional(),
    bg_image: z.string().optional(),
    bg_video: z.string().optional(),
    schedule: z.array(z.object({
      days: z.string(),
      hours: z.string(),
      status: z.string()
    })).optional(),
    phone: z.string().optional(),
    phone_clean: z.string().optional(),
    whatsapp: z.string().optional(),
    email: z.string().optional(),
    address: z.string().optional(),
    latitude: z.number().optional(),
    longitude: z.number().optional()
  })
});

const catalogueCollection = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/catalogue' }),
  schema: z.object({
    title: z.string(),
    category: z.string(),
    company: z.string(),
    weight: z.number().optional(),
    rate: z.string(),
    rate_type: z.string().optional(),
    rate_date: z.string().optional(),
    lead_time: z.string(),
    materials: z.array(z.string()),
    certifications: z.array(z.string()).optional(),
    teams: z.array(z.string()).optional(),
    images: z.array(z.string()).optional(),
    youtube_url: z.string().optional()
  })
});

const teamsCollection = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/teams' }),
  schema: z.object({
    title: z.string(),
    role: z.string(),
    weight: z.number().optional(),
    photo: z.string().optional(),
    experience: z.string().optional(),
    skills: z.string().optional(),
    phone: z.string().optional(),
    phone_clean: z.string().optional(),
    whatsapp: z.string().optional(),
    email: z.string().optional(),
    website: z.string().optional(),
    youtube: z.string().optional(),
    instagram: z.string().optional(),
    upi_id: z.string().optional()
  })
});

const homeCollection = defineCollection({
  loader: glob({ pattern: '**/index.md', base: './src/content/home' }),
  schema: z.object({
    title: z.string().optional()
  })
});

export const collections = {
  company: companyCollection,
  catalogue: catalogueCollection,
  teams: teamsCollection,
  home: homeCollection
};
