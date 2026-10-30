/**
 * Reglas de contraseña — deben reflejar la política real de ASP.NET Core
 * Identity configurada en ContaboxPro.Backend.Identity. El proyecto NO
 * sobreescribe `IdentityOptions.Password` (confirmado en Program.cs), así
 * que corre con los defaults de Identity:
 *   RequiredLength = 6, RequireUppercase, RequireLowercase, RequireDigit,
 *   RequireNonAlphanumeric = true, RequiredUniqueChars = 1.
 *
 * El mínimo de caracteres aquí es 8, no 6 — más estricto a propósito (una
 * contraseña de 8+ caracteres siempre cumple el mínimo de 6 del backend, así
 * que no hay incompatibilidad). Si el backend alguna vez cambia su política,
 * este archivo hay que actualizarlo a mano — no hay endpoint que la exponga.
 */

export const PASSWORD_MIN_LENGTH = 8;

/** Devuelve un mensaje por cada regla que la contraseña NO cumple (vacío si es válida). */
export function getPasswordErrors(password: string): string[] {
  const errors: string[] = [];

  if (password.length < PASSWORD_MIN_LENGTH) {
    errors.push(`Debe tener al menos ${PASSWORD_MIN_LENGTH} caracteres.`);
  }
  if (!/[A-Z]/.test(password)) {
    errors.push("Debe incluir al menos una letra mayúscula.");
  }
  if (!/[a-z]/.test(password)) {
    errors.push("Debe incluir al menos una letra minúscula.");
  }
  if (!/[0-9]/.test(password)) {
    errors.push("Debe incluir al menos un número.");
  }
  if (!/[^A-Za-z0-9]/.test(password)) {
    errors.push("Debe incluir al menos un carácter especial (ej. !@#$%).");
  }

  return errors;
}

export function isPasswordValid(password: string): boolean {
  return getPasswordErrors(password).length === 0;
}
