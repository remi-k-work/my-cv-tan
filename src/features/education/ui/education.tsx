// react
import { Fragment } from "react";

// services, features, and other libraries
import { useGT } from "gt-tanstack-start";

// components
import { PageSection } from "@/ui/page-section";

// types
import type { EducationList } from "@/features/education/domain/models";

// One education entry: the definition term (name, year, location) and its description (info)
interface EducationEntryProps {
  name: string;
  year: string;
  location: string;
  info: string;
}

interface EducationProps {
  educationList: EducationList;
}

function EducationEntry({ name, year, location, info }: EducationEntryProps) {
  return (
    <Fragment>
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
  );
}

export function Education({ educationList }: EducationProps) {
  const gt = useGT();

  return (
    <PageSection title={gt("My Education")}>
      <dl>
        {educationList.map((entry, index) => (
          <EducationEntry key={`${index}-${entry.name}`} {...entry} />
        ))}
      </dl>
    </PageSection>
  );
}
