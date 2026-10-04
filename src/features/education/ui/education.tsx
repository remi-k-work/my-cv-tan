// react
import { Fragment } from "react";

// components
import { PanelCaption } from "@/ui/panel-caption";

// types
import type { LocalizedContent } from "@/domain";
import type { EducationList } from "@/features/education/domain";

interface EducationProps {
  localizedContent: LocalizedContent;
  educationList: EducationList;
}

export function Education({ localizedContent, educationList }: EducationProps) {
  return (
    <figure className="mx-auto w-full max-w-4xl">
      <PanelCaption>{localizedContent["myEducation"]["myEducation"]}</PanelCaption>
      <dl>
        {educationList.map(({ name, year, location, info }, index) => (
          <Fragment key={index}>
            <dt className="mb-4">
              <h2 className="text-lg text-text-2 uppercase">{name}</h2>
              <p className="text-sm font-semibold tracking-widest text-accent">{year}</p>
              <p>{location}</p>
            </dt>
            <dd className="mb-8 last:mb-0">
              <p>{info}</p>
            </dd>
          </Fragment>
        ))}
      </dl>
    </figure>
  );
}
