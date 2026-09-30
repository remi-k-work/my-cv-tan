// services, features, and other libraries
import { Option } from "effect";
import { Atom } from "effect/unstable/reactivity";

// types
import type { Experience } from "@/domain";

export const experienceAtom = Atom.make<Option.Option<Experience>>(Option.none());
