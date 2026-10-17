// react
import { Fragment, useId } from "react";

// services, features, and other libraries
import { useGT } from "gt-tanstack-start";

// components
import { PanelCaption } from "@/ui/panel-caption";

// types
import type { EducationList } from "@/features/education/domain/models";

interface EducationProps {
  educationList: EducationList;
}

export function Education({ educationList }: EducationProps) {
  const gt = useGT();
  const headingId = useId();

  return (
    <section className="mx-auto w-full max-w-4xl" aria-labelledby={headingId}>
      <PanelCaption id={headingId}>{gt("My Education")}</PanelCaption>
      <dl>
        {educationList.map(({ name, year, location, info }, index) => (
          <Fragment key={index}>
            <dt className="scroll-rise mb-4">
              {/* A paragraph, not a heading: heading content is not allowed inside a definition term */}
              <p className="max-w-[35ch] text-lg text-balance text-text-2 uppercase">{name}</p>
              <p className="text-sm font-semibold tracking-widest text-accent">{year}</p>
              <p>{location}</p>
            </dt>
            <dd className="scroll-rise mb-8 last:mb-0">
              <p>{info}</p>
            </dd>
          </Fragment>
        ))}
      </dl>
    </section>
  );
}
