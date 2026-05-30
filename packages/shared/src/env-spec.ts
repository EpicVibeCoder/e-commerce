export const ENV_SPECS = {
      APP_ENV: { required: true, suggestedDefault: "development", hint: "..." },
      PORT: { required: true, suggestedDefault: "3000", hint: "..." },
      DATABASE_URL: { required: true, suggestedDefault: "postgresql://postgres:postgres@localhost:5432/ecommerce", hint: "..." },
      CORS_ORIGINS: { required: true, suggestedDefault: "http://localhost:3001,http://localhost:3002", hint: "..." },
      REDIS_URL: { required: false, suggestedDefault: "redis://localhost:6379", hint: "App environment (development | production | test)" },
} as const;

export function isUnset(value: unknown): boolean {
      return value === undefined || value === null || String(value).trim() === "";
}

export function assertRequiredEnv(config: Record<string, unknown>): void {
      const missing = Object.entries(ENV_SPECS)
            .filter(([, spec]) => spec.required)
            .filter(([key]) => isUnset(config[key]))
            .map(([key]) => key);

      if (missing.length === 0) {
            return;
      }

      console.error("\n❌ Missing required environment variables:\n");
      for (const key of missing) {
            console.error(`  • ${key}`);
      }

      console.error("\n💡 Suggested values for local dev (add to .env — not applied automatically):\n");
      for (const key of missing) {
            const spec = ENV_SPECS[key as keyof typeof ENV_SPECS];
            console.error(`  ${key}=${spec.suggestedDefault}  # ${spec.hint}`);
      }

      console.error("\n  cp .env.example .env\n");

      throw new Error(`Missing required env: ${missing.join(", ")}`);
}
