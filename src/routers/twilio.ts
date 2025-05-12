import express from "express";
import TwilioClient from "twilio";
import AccessToken, { VoiceGrant } from "twilio/lib/jwt/AccessToken";
import VoiceResponse from "twilio/lib/twiml/VoiceResponse";

import { authenticateUser } from "../middlewares";
import { ActiveCalls } from "../services/active-calls";

import config from "../config";

const router = express.Router();

router.post("/token", authenticateUser, (req, res) => {
  console.log("inside");
  const identity = "webrtc_user";

  const accessToken = new AccessToken(
    config.accountSid as string,
    config.apiKey as string,
    config.apiSecret as string,
  );
  if (!accessToken) {
    throw new Error("Something went wrong");
  }
  accessToken.identity = identity;

  const grant = new VoiceGrant({
    outgoingApplicationSid: config.twimlAppSid as string,
    incomingAllow: true,
  });
  accessToken.addGrant(grant);

  res.status(200).json({
    identity,
    token: accessToken.toJwt(),
  });
});

router.post("/status-callback", (req, res) => {
  console.log("Status callback");
  const { CallStatus, CallSid } = req.body;
  const client = TwilioClient(
    config.accountSid as string,
    config.authToken as string,
  );

  console.log(`Call SID: ${CallSid} has status: ${CallStatus}`);

  if (CallStatus === "in-progress") {
    const twiml = new VoiceResponse();
    const dial = twiml.dial();

    dial.client("webrtc_user");

    ActiveCalls.getCalls().forEach(async ({ callSid }: { callSid: string }) => {
      if (callSid !== CallSid) {
        try {
          await client.calls(callSid).update({ status: "completed" });
        } catch (error) {
          console.error(`Error ending call ${callSid}: `, error);
        }
      }
    });

    res.status(200).send(twiml.toString());
  } else if (
    ["completed", "canceled", "failed", "no-answer", "busy"].includes(
      CallStatus,
    )
  ) {
    console.log(`Removing call ${CallSid} from active list`);
    ActiveCalls.removeCall(CallSid);
    res.status(200).end();
  } else {
    res.status(200).end();
  }
});

export { router as twilioRouter };
