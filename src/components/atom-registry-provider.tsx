// services, features, and other libraries
import { RegistryContext, scheduleTask } from "@effect/atom-react";
import { AtomRegistry } from "effect/unstable/reactivity";

// types
import type { ReactNode } from "react";

// Shared AtomRegistry singleton + React provider
export const sharedAtomRegistry: AtomRegistry.AtomRegistry = AtomRegistry.make({ scheduleTask });

export function AtomRegistryProvider({ children }: { children: ReactNode }) {
  return <RegistryContext value={sharedAtomRegistry}>{children}</RegistryContext>;
}
