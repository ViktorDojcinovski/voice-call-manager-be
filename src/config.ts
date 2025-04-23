import dotenv from "dotenv";

type Config = {
  [key: string]: string | number | string[];
};

let cfg: Config = {};

if (process.env.NODE_ENV !== "test") {
  dotenv.config({ path: ".env" });
} else {
  dotenv.config({ path: ".env.example" });
}

if (!process.env.TWILIO_ACCOUNT_SID) {
  throw new Error("TWILIO_ACCOUNT_SID must be defined");
}
if (!process.env.TWILIO_AUTH_TOKEN) {
  throw new Error("TWILIO_AUTH_TOKEN must be defined");
}
if (!process.env.TWILIO_TWIML_APP_SID) {
  throw new Error("TWILIO_TWIML_APP_SID must be defined");
}
if (!process.env.TWILIO_CALLER_IDS) {
  throw new Error("TWILIO_CALLER_IDS must be defined");
}
if (!process.env.TWILIO_API_KEY) {
  throw new Error("TWILIO_API_KEY must be defined");
}
if (!process.env.TWILIO_API_SECRET) {
  throw new Error("TWILIO_API_SECRET must be defined");
}

// HTTP Port to run our web application
cfg.port = process.env.PORT || 3000;

// Your Twilio account SID and auth token, both found at:
// https://www.twilio.com/user/account
//
// A good practice is to store these string values as system environment
// variables, and load them from there as we are doing below. Alternately,
// you could hard code these values here as strings.
cfg.accountSid = process.env.TWILIO_ACCOUNT_SID;
cfg.authToken = process.env.TWILIO_AUTH_TOKEN;

cfg.twimlAppSid = process.env.TWILIO_TWIML_APP_SID;
cfg.callerIds = process.env.TWILIO_CALLER_IDS;

cfg.apiKey = process.env.TWILIO_API_KEY;
cfg.apiSecret = process.env.TWILIO_API_SECRET;

// CORS config object values
cfg.allowedOrigin =
  process.env.NODE_ENV === "production"
    ? "https://viktordojcinovski.github.io/voice-call-manager-fe/#/"
    : "http://localhost:5173";
cfg.allowedMethods = ["GET", "POST", "PATCH", "DELETE", "OPTIONS"];

// Export configuration object
export default cfg;
