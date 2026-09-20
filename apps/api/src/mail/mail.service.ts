import { Injectable, Logger } from "@nestjs/common";

@Injectable()
export class MailService {
      private readonly logger = new Logger(MailService.name);

      async sendVerificationEmail(params: { to: string; token: string }): Promise<void> {
            // Stub until Phase 5 (Resend / Mailpit)
            this.logger.log(`Verification email stub → to=${params.to} token=${params.token}`);
      }
}
