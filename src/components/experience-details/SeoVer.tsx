// react
import { Fragment } from "react";

// types
import type { JobExperience } from "@/types/shared";

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
          <a href={videoLink ?? liveLink} target="_blank" rel="noopener noreferrer">
            <>{videoLink ?? liveLink}</>
          </a>
        </p>
      )}
      {gitHubLink && (
        <p>
          <a href={gitHubLink} target="_blank" rel="noopener noreferrer">
            <>{gitHubLink}</>
          </a>
        </p>
      )}
      <p>{txt}</p>
    </article>
  );
}
