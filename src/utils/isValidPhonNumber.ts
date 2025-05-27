import { isValidNumber, parsePhoneNumber } from "libphonenumber-js";

export const isValidPhoneNumber = (phone?: string | null): boolean => {
  if (!phone || typeof phone !== "string") return false;

  try {
    const parsed = parsePhoneNumber(phone, "US");
    return parsed.isValid();
  } catch (e) {
    return false;
  }
};
