import Client, { Twilio } from "twilio";

import config from "../../config";

export class TwilioClient {
  private static client: Twilio | null = null;

  private constructor() {}

  static getClient(): Twilio {
    if (!this.client) {
      this.client = Client(
        config.accountSid as string,
        config.authToken as string,
      );
    }

    return this.client;
  }
}
