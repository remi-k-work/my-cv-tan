// services, features, and other libraries
import { Schema } from "effect";

// types
export type EducationList = typeof EducationList.Type;

const Education = Schema.Struct({
  name: Schema.Trim.check(Schema.isNonEmpty()),
  year: Schema.Trim.check(Schema.isNonEmpty()),
  location: Schema.Trim.check(Schema.isNonEmpty()),
  info: Schema.Trim.check(Schema.isNonEmpty()),
});
export const EducationList = Schema.Array(Education);
