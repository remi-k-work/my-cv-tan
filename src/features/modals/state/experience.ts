// services, features, and other libraries
import { Option } from "effect";
import { Atom } from "effect/reactivity";

// types
import type { Experience } from "@/features/experience/domain/models";

export const experienceAtom = Atom.make<Option.Option<Experience>>(Option.none());
