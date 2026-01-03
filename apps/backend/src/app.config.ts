import * as Joi from 'joi';

export const configValidationSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
  PORT: Joi.number().default(3000),

  // Database Validation
  DATABASE_URL: Joi.string().optional(),
  DB_HOST: Joi.string().default('localhost'), // Add this
  DB_NAME: Joi.string().when('DATABASE_URL', {
    is: Joi.exist(),
    then: Joi.optional(),
    otherwise: Joi.required(),
  }),
  DB_USER: Joi.string().when('DATABASE_URL', {
    is: Joi.exist(),
    then: Joi.optional(),
    otherwise: Joi.required(),
  }),
  DB_PASSWORD: Joi.string().when('DATABASE_URL', {
    is: Joi.exist(),
    then: Joi.optional(),
    otherwise: Joi.required(),
  }),
  DB_PORT: Joi.number().default(3306),
  DB_ROOT_PASSWORD: Joi.string().when('DATABASE_URL', {
    is: Joi.exist(),
    then: Joi.optional(),// Production: Managed DB, no Docker
    otherwise: Joi.required(),// Development: Docker Compose needs it
  }),
  DB_ALLOW_PUBLIC_KEY_RETRIEVAL: Joi.string().valid('true', 'false').required(),
  DB_SSL: Joi.string().valid('true', 'false').required(),
  // Redis Validation
  REDIS_HOST: Joi.string().required(),
  REDIS_PORT: Joi.number().default(6379),
  REDIS_PASSWORD: Joi.string().optional(),
  CORS_ORIGIN: Joi.string().default('*'),

  JWT_SECRET: Joi.string().min(32).required(),
  JWT_EXPIRES_IN: Joi.string().default('24h'),
  STRIPE_SECRET_KEY: Joi.string().optional(),
  STRIPE_WEBHOOK_SECRET: Joi.string().optional(),
  BKASH_APP_KEY: Joi.string().optional(),
  BKASH_APP_SECRET: Joi.string().optional(),
  BKASH_USERNAME: Joi.string().optional(),
  BKASH_PASSWORD: Joi.string().optional(),
  BKASH_BASE_URL: Joi.string().default('https://tokenized.sandbox.bka.sh/v1.2.0-beta'),
  BKASH_IS_SANDBOX: Joi.string().valid('true', 'false').default('true'),
});
