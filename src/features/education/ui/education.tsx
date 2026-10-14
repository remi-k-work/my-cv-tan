// react
import { Fragment } from "react";

// services, features, and other libraries
import { useGT } from "gt-tanstack-start";

// components
import { PanelCaption } from "@/ui/panel-caption";

// types
import type { EducationList } from "@/features/education/domain";

interface EducationProps {
  educationList: EducationList;
}

export function Education({ educationList }: EducationProps) {
  const gt = useGT();

  return (
    <figure className="mx-auto w-full max-w-4xl">
      <PanelCaption>{gt("My Education")}</PanelCaption>
      <dl>
        {educationList.map(({ name, year, location, info }, index) => (
          <Fragment key={index}>
            <dt className="scroll-rise mb-4">
              <h2 className="text-lg text-text-2 uppercase">{name}</h2>
              <p className="text-sm font-semibold tracking-widest text-accent">{year}</p>
              <p>{location}</p>
            </dt>
            <dd className="scroll-rise mb-8 last:mb-0">
              <p>{info}</p>
            </dd>
          </Fragment>
        ))}
      </dl>
    </figure>
  );
}
