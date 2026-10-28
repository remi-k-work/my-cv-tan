// react
import { Option } from "effect";

// services, features, and other libraries
import { useAtomSet, useAtomValue } from "@effect/atom-react";
import { useGT } from "gt-tanstack-start";
import { experienceAtom } from "@/features/modals/state/experience";

// components
import { ExperienceDetails } from "@/features/experience/ui/experience-details";
import { ExperienceModal } from "./experience";

// The home-page overlay: subscribes to the selected experience in isolation, so opening/closing the overlay
// doesn't re-render the sliders it sits on top of
export function ExperienceDetailsModal() {
  const gt = useGT();

  const currExperience = useAtomValue(experienceAtom);
  const clearExperience = useAtomSet(experienceAtom);

  return (
    <ExperienceModal isOpen={Option.isSome(currExperience)} onClosed={() => clearExperience(Option.none())} title={gt("Project Info & Description")}>
      {Option.match(currExperience, {
        onNone: () => null,
        onSome: (experience) => <ExperienceDetails experience={experience} />,
      })}
    </ExperienceModal>
  );
}
