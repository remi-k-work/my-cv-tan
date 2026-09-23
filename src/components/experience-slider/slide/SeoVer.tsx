// react
import { Fragment } from "react";

// types
import type { Experience } from "@/domain";

interface SlideSeoProps {
  experience: Experience;
}

export default function SlideSeo({ experience: { year, role, company, txt, skillsUsed, gitHubLink, liveLink, videoLink } }: SlideSeoProps) {
  return (
    <>
      <h2 className="text-xl">{role}</h2>
      <h3>{company}</h3>
      <h4>
        {skillsUsed.map((skillUsed, index) => (
          <Fragment key={index}>{skillUsed} </Fragment>
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
    </>
  );
}
