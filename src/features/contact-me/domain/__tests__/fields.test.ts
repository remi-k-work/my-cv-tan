// The contact-form field schemas: every limit the HTML inputs declare against is enforced by the
// schema itself, so a value the DOM would refuse (or admit one character past) resolves the same
// way whether the form is validated in the browser or decoded from an RPC payload.

import { assert, it } from "@effect/vitest";
import { Result, Schema } from "effect";
import { EmailField, MessageField, NameField, SubjectField } from "../fields";
import { CaptchaInputField } from "@/features/captcha/domain/fields";

// constants
import { EMAIL_MAX_LENGTH, MESSAGE_MAX_LENGTH, NAME_MAX_LENGTH, SUBJECT_MAX_LENGTH } from "../constants";
import { STRENGTH } from "@/features/captcha/domain/constants";

// The field schemas carry no decoding services, so the decoder's own constraint is spelled at the
// helper boundary rather than widening every field to `Schema.Top`
const decode = <S extends Schema.Codec<unknown, string, never>>(schema: S, value: string) => Schema.decodeResult(schema)(value);

it("an email at the declared maximum decodes, and one past it fails", () => {
  // A 50-character address is a real one (a long local part plus a long domain), so the schema
  // must accept exactly the maximum rather than treating it as over the limit
  const atLimit = `${"a".repeat(EMAIL_MAX_LENGTH - "@example.com".length)}@example.com`;
  assert.strictEqual(atLimit.length, EMAIL_MAX_LENGTH);
  assert.isTrue(Result.isSuccess(decode(EmailField.schema, atLimit)));

  const overLimit = `${"a".repeat(EMAIL_MAX_LENGTH + 1 - "@example.com".length)}@example.com`;
  assert.isTrue(Result.isFailure(decode(EmailField.schema, overLimit)));
});

it("every field's schema rejects an empty value, so the form cannot submit a blank field", () => {
  for (const field of [NameField, EmailField, SubjectField, MessageField, CaptchaInputField]) {
    assert.isTrue(Result.isFailure(decode(field.schema, "")), `${field.key} accepted an empty value`);
  }
});

it("each field's schema caps its value at the constant the HTML input's maxLength derives from", () => {
  // The inputs admit one character past the limit so the schema's own message fires; the schema
  // is the authority, so the value at the constant decodes and the one past it does not
  const cases = [
    { field: NameField, limit: NAME_MAX_LENGTH },
    { field: SubjectField, limit: SUBJECT_MAX_LENGTH },
    { field: MessageField, limit: MESSAGE_MAX_LENGTH },
    { field: CaptchaInputField, limit: STRENGTH },
  ] as const;

  for (const { field, limit } of cases) {
    assert.isTrue(Result.isSuccess(decode(field.schema, "a".repeat(limit))), `${field.key} rejected a value at its limit`);
    assert.isTrue(Result.isFailure(decode(field.schema, "a".repeat(limit + 1))), `${field.key} accepted a value past its limit`);
  }
});
