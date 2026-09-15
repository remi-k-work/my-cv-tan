// react
import { Fragment } from "react";

// types
import type { EducationSchool, LocalizedContent } from "@/types/shared";

interface MyEducationProps {
  localizedContent: LocalizedContent;
  allEducationSchools: EducationSchool[];
}

export default function MyEducation({ localizedContent, allEducationSchools }: MyEducationProps) {
  return (
    <figure className="mx-auto w-full max-w-2xl">
      <figcaption className="mb-4 place-self-end rounded-ss-xl rounded-ee-xl bg-primary-foreground p-3 italic">
        {localizedContent["myEducation"]["myEducation"]}
      </figcaption>
      <dl>
        {allEducationSchools.map(({ name, year, location, info }, schoolIndex) => (
          <Fragment key={schoolIndex}>
            <dt className="mb-4">
              <h2 className="text-lg text-clr-primary-200 uppercase">{name}</h2>
              <p className="text-sm font-semibold tracking-widest text-accent-foreground">{year}</p>
              <p className="text-primary-foreground">{location}</p>
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
