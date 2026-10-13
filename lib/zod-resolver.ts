import type { ZodType } from "zod";
import type { Resolver, FieldErrors, FieldError } from "react-hook-form";

/**
 * Lightweight, robust Zod resolver for React Hook Form.
 * Avoids bundler and peer dependency resolution issues across Next.js / Turbopack / pnpm.
 */
export function zodResolver<T extends Record<string, unknown>>(
  schema: ZodType<T>
): Resolver<T> {
  return async (values) => {
    const result = await schema.safeParseAsync(values);
    if (result.success) {
      return {
        values: result.data,
        errors: {},
      };
    }

    const errors: Record<string, FieldError> = {};
    for (const issue of result.error.issues) {
      const path = issue.path.join(".") || "root";
      if (!errors[path]) {
        errors[path] = {
          type: issue.code,
          message: issue.message,
        };
      }
    }

    return {
      values: {} as Record<string, never>,
      errors: errors as FieldErrors<T>,
    };
  };
}