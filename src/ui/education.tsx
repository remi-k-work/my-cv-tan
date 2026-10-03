// react
import { Fragment } from "react";

// types
import type { EducationList, LocalizedContent } from "@/domain";

interface EducationProps {
  localizedContent: LocalizedContent;
  educationList: EducationList;
}

export function Education({ localizedContent, educationList }: EducationProps) {
  return (
    <figure className="mx-auto w-full max-w-4xl">
      <figcaption className="mb-4 place-self-end rounded-ss-xl rounded-ee-xl bg-surface-1 p-3 tracking-widest text-text-2 uppercase">
        {localizedContent["myEducation"]["myEducation"]}
      </figcaption>
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
