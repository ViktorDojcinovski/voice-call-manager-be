import express from "express";
import TwilioClient from "twilio";
import AccessToken, { VoiceGrant } from "twilio/lib/jwt/AccessToken";
import VoiceResponse from "twilio/lib/twiml/VoiceResponse";

import { authenticateUser } from "../middlewares";
import { ActiveCalls } from "../services/active-calls";

import config from "../config";

const router = express.Router();
const client = TwilioClient(
  config.accountSid as string,
  config.authToken as string,
);

let userCallConnected: { [key: string]: boolean } = {};

router.post("/token", authenticateUser, (req, res) => {
  const identity = "webrtc_user";

  const accessToken = new AccessToken(
    config.accountSid as string,
    config.apiKey as string,
    config.apiSecret as string,
  );
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

router.post("/start-calls", authenticateUser, async (req, res) => {
  const { contacts, userId } = req.body;
  userCallConnected[userId] = false;

  for (const contact of contacts) {
    try {
      const call = await client.calls.create({
        url: `${config.baseUrl}/twilio/twiml-handler?contactId=${contact.id}&userId=${userId}`,
        to: contact.phone,
        from: config.twilioCallerId as string,
        statusCallback: `${config.baseUrl}/twilio/status-callback?userId=${userId}&contactId=${contact.id}`,
        statusCallbackEvent: ["initiated", "ringing", "answered", "completed"],
        statusCallbackMethod: "POST",
      });
      ActiveCalls.addCall(call.sid, contact);
    } catch (error) {
      console.error("Failed to create call:", error);
    }
  }

  res.status(200).send("Calls initiated");
});

router.post("/twiml-handler", (req, res) => {
  const { contactId, userId } = req.query;
  const twiml = new VoiceResponse();
  const dial = twiml.dial({ timeout: 20 });
  dial
    .client("webrtc_user")
    .parameter({ name: "contactId", value: contactId as string });
  res.type("text/xml").send(twiml.toString());
});

router.post("/status-callback", async (req, res) => {
  const { Called, CallStatus, CallSid, AnsweredBy } = req.body;
  const userId = req.query.userId as string;
  const contactId = req.query.contactId as string;
  const io = req.app.get("io");

  console.log("Status Callback: ${CallSid} - ${CallStatus}");
  io.to(`user-${userId}`).emit(`call-status-user-${userId}`, {
    to: Called,
    status: CallStatus,
    answeredBy: AnsweredBy || null,
  });

  if (CallStatus === "in-progress" && !userCallConnected[userId]) {
    userCallConnected[userId] = true;

    // Hang up other parallel calls
    for (const { callSid } of ActiveCalls.getCalls()) {
      if (callSid !== CallSid) {
        try {
          await client.calls(callSid).update({ status: "completed" });
        } catch (error) {
          console.error("Failed to hang up ${callSid}:", error);
        }
      }
    }
  }

  if (
    ["completed", "canceled", "failed", "no-answer", "busy"].includes(
      CallStatus,
    )
  ) {
    ActiveCalls.removeCall(CallSid);
  }

  res.status(200).end();
});

export default router;
