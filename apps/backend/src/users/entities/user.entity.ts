import { $Enums } from '../../generated/prisma/client';

export class User {
      constructor(
            public readonly id: string,
            public readonly email: string,
            public readonly firstName: string,
            public readonly lastName: string,
            public readonly role: $Enums.Role,
            public readonly isActive: boolean,
            public readonly createdAt: Date,
            public readonly updatedAt: Date,
      ) {}

      /**
       * Factory method to create User entity from Prisma model
       */
      static fromPrisma(prismaUser: {
            id: string;
            email: string;
            firstName: string;
            lastName: string;
            role: $Enums.Role;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
      }): User {
            return new User(
                  prismaUser.id,
                  prismaUser.email,
                  prismaUser.firstName,
                  prismaUser.lastName,
                  prismaUser.role,
                  prismaUser.isActive,
                  prismaUser.createdAt,
                  prismaUser.updatedAt,
            );
      }

      /**
       * Get full name
       */
      getFullName(): string {
            return `${this.firstName} ${this.lastName}`;
      }

      /**
       * Check if user is admin
       */
      isAdmin(): boolean {
            return this.role === $Enums.Role.ADMIN;
      }

      /**
       * Check if user is customer
       */
      isCustomer(): boolean {
            return this.role === $Enums.Role.CUSTOMER;
      }

      /**
       * Check if user is active
       */
      canAuthenticate(): boolean {
            return this.isActive;
      }
      /**
       * Check if user can perform admin actions
       */
      canPerformAdminActions(): boolean {
            return this.isActive && this.isAdmin();
      }
      /**
       * Convert to JSON (exclude sensitive data)
       */
      toJSON(): {
            id: string;
            email: string;
            firstName: string;
            lastName: string;
            role: $Enums.Role;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
      } {
            return {
                  id: this.id,
                  email: this.email,
                  firstName: this.firstName,
                  lastName: this.lastName,
                  role: this.role,
                  isActive: this.isActive,
                  createdAt: this.createdAt,
                  updatedAt: this.updatedAt,
            };
      }
}
