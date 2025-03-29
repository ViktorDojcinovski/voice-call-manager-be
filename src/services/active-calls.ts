export class ActiveCalls {
  private static calls: Array<{
    callSid: string;
    phoneNumber: string;
    timestamp: Number;
  }> = [];

  static addCall(callSid: string, phoneNumber: string) {
    this.calls.push({ callSid, phoneNumber, timestamp: Date.now() });
  }

  static removeCall(callSid: string) {
    this.calls = this.calls.filter((call) => call.callSid !== callSid);
  }

  static getCalls() {
    return this.calls;
  }

  static resetCalls() {
    this.calls = [];
  }
}
