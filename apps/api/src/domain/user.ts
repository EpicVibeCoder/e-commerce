import { Role } from "../generated/prisma/enums.js";
import { DomainError } from "./domain-error.js";
import type { UserPersistence } from "./types.js";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const VALID_ROLES = new Set<string>(Object.values(Role));

export class User {
      readonly id: string;
      readonly email: string;
      readonly role: Role;
      readonly name?: string;
      readonly avatar?: string;

      constructor(props: { id: string; email: string; role: Role; name?: string; avatar?: string }) {
            User.assertEmail(props.email);
            User.assertRole(props.role);
            this.id = props.id;
            this.email = props.email.trim().toLowerCase();
            this.role = props.role;
            this.name = props.name;
            this.avatar = props.avatar;
      }

      static fromPersistence(data: UserPersistence): User {
            return new User({
                  id: data.id,
                  email: data.email,
                  role: data.role,
                  name: data.name ?? undefined,
                  avatar: data.avatar ?? undefined,
            });
      }

      isAdmin(): boolean {
            return this.role === Role.admin || this.role === Role.super_admin;
      }

      static assertEmail(email: string): void {
            const normalized = email.trim().toLowerCase();
            if (!EMAIL_PATTERN.test(normalized)) {
                  throw new DomainError(`Invalid email: ${email}`);
            }
      }

      static assertRole(role: Role): void {
            if (!VALID_ROLES.has(role)) {
                  throw new DomainError(`Invalid role: ${role}`);
            }
      }
}
