// react
import { Fragment } from "react";

// types
import type { EducationList, LocalizedContent } from "@/domain";

interface MyEducationProps {
  localizedContent: LocalizedContent;
  educationList: EducationList;
}

export default function MyEducation({ localizedContent, educationList }: MyEducationProps) {
  return (
    <figure className="mx-auto w-full max-w-2xl">
      <figcaption className="mb-4 place-self-end rounded-ss-xl rounded-ee-xl bg-primary-foreground p-3 italic">
        {localizedContent["myEducation"]["myEducation"]}
      </figcaption>
      <dl>
        {educationList.map(({ name, year, location, info }, index) => (
          <Fragment key={index}>
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
