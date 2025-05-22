import express from "express";
import TwilioClient from "twilio";
import AccessToken, { VoiceGrant } from "twilio/lib/jwt/AccessToken";
import VoiceResponse from "twilio/lib/twiml/VoiceResponse";

import { authenticateUser } from "../middlewares";
import { ActiveCalls } from "../services/active-calls";

import config from "../config";

const router = express.Router();

router.post("/token", authenticateUser, (req, res) => {
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

router.post("/status-callback", async (req, res) => {
  const { Called, CallStatus, CallSid, AnsweredBy } = req.body;
  const userId = req.query.userId as string;
  const contactId = req.query.contactId as string;

  const io = req.app.get("io");
  console.log(`EMITTING to user-${userId}: call-status-user-${userId}`, {
    to: Called,
    status: CallStatus,
    answeredBy: AnsweredBy || null,
  });
  io.to(`user-${userId}`).emit(`call-status-user-${userId}`, {
    to: Called,
    status: CallStatus,
    answeredBy: AnsweredBy || null,
  });
  console.log("Emit complete");

  const client = TwilioClient(
    config.accountSid as string,
    config.authToken as string,
  );
  console.log(`Call SID: ${CallSid} has status: ${CallStatus}`);
  if (AnsweredBy) {
    console.log(`Call was answered by: ${AnsweredBy}`);
  }

  if (CallStatus === "in-progress") {
    if (AnsweredBy === "machine_start") {
      console.log("Voicemail detected — optionally hang up or leave a message");
    }

    // Proceed with connecting to WebRTC user
    const twiml = new VoiceResponse();
    const dial = twiml.dial();
    dial
      .client("webrtc_user")
      .parameter({ name: "contactId", value: contactId });

    for (const { callSid } of ActiveCalls.getCalls()) {
      if (callSid !== CallSid) {
        try {
          await client.calls(callSid).update({ status: "completed" });
        } catch (error) {
          console.error(`Error ending call ${callSid}: `, error);
        }
      }
    }

    res.type("text/xml").status(200).send(twiml.toString());
  } else if (
    ["completed", "canceled", "failed", "no-answer", "busy"].includes(
      CallStatus,
    )
  ) {
    console.log(`Call ${CallSid} ended with status: ${CallStatus}`);

    // Optionally inform UI more clearly
    io.to(`user-${userId}`).emit(`call-status-user-${userId}`, {
      to: Called,
      status: CallStatus,
      reason: req.body?.AnsweredBy || "N/A",
    });

    ActiveCalls.removeCall(CallSid);
    res.status(200).end();
  } else {
    res.status(200).end();
  }
});

router.post("/voice-response", (req, res) => {
  const VoiceResponse = TwilioClient.twiml.VoiceResponse;
  const twiml = new VoiceResponse();

  const contactId = req.query.contactId as string;

  // Use `as any` to access internal builder
  const dial = (twiml as any).ele("Dial");
  const client = dial.ele("Client", {}, "webrtc_user");
  client.ele("Parameter", { name: "contactId", value: contactId });

  res.type("text/xml");
  res.send(twiml.toString());
});

export { router as twilioRouter };
