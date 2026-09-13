// react
import { Fragment } from "react";

// next
import Link from "next/link";

// types
import type { JobExperience } from "@/types/shared";
import type { UrlObject } from "url";

interface ExperienceDetailsSeoProps {
  allExperiences: [JobExperience[], JobExperience[]];
  type: "e" | "p";
  index: number;
}

export default function ExperienceDetailsSeo({ allExperiences, type, index }: ExperienceDetailsSeoProps) {
  const experience = allExperiences[type === "e" ? 0 : 1][index];
  const { year, role, company, txt, skillsUsed, gitHubLink, liveLink, videoLink } = experience;

  return (
    <article className="sr-only">
      <h2 className="text-xl">{role}</h2>
      <h3>{company}</h3>
      <h4>
        {skillsUsed.map((skillUsed, skillIndex) => (
          <Fragment key={skillIndex}>{skillUsed} </Fragment>
        ))}
      </h4>
      <p>{year}</p>
      {(liveLink || videoLink) && (
        <p>
          <Link href={(videoLink ?? liveLink) as UrlObject} prefetch={false} target="_blank" rel="noopener noreferrer">
            <>{videoLink ?? liveLink}</>
          </Link>
        </p>
      )}
      {gitHubLink && (
        <p>
          <Link href={gitHubLink as UrlObject} prefetch={false} target="_blank" rel="noopener noreferrer">
            <>{gitHubLink}</>
          </Link>
        </p>
      )}
      <p>{txt}</p>
    </article>
  );
}
