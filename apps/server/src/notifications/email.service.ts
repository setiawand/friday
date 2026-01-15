import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class EmailService {
  private logger = new Logger(EmailService.name);

  async sendEmail(to: string, subject: string, body: string) {
    this.logger.log(`Email to ${to} | ${subject} | ${body}`);
  }
}

