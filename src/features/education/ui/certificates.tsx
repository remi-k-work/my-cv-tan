// services, features, and other libraries
import { useGT } from "gt-tanstack-start";
import { motion } from "motion/react";
import { useTilt } from "@/features/experience/hooks";

// components
import { PanelCaption } from "@/ui/panel-caption";

// assets
import artcom from "@/assets/my-certificates-artcom.webp";
import alcc from "@/assets/my-certificates-alcc.webp";
import prattOrig from "@/assets/my-certificates-pratt-orig.webp";
import prattTrans from "@/assets/my-certificates-pratt-trans.webp";

// types
interface CertificateSheetProps {
  src: string;
  width: number;
  height: number;
  alt: string;
}

// One certificate sheet: rises in on scroll, then leans away from the pointer with the same gentle physics as the
// experience slides, the accent sheen tracking the pointer across the paper. Pure enhancement — the sheet is fully
// visible in the SSR markup, and tilt handlers are only attached for fine pointers
function CertificateSheet({ src, width, height, alt }: CertificateSheetProps) {
  const { style, handlers, glareStyle } = useTilt();

  return (
    <div className="scroll-rise">
      <motion.div className="relative" style={style} {...handlers}>
        <img src={src} width={width} height={height} alt={alt} loading="lazy" className="h-auto w-full" />
        <motion.div aria-hidden className="pointer-events-none absolute inset-0" style={glareStyle} />
      </motion.div>
    </div>
  );
}

export function Certificates() {
  const gt = useGT();

  return (
    <figure className="mx-auto w-full max-w-4xl">
      <PanelCaption>{gt("My Certificates")}</PanelCaption>
      <a href="/my-certificates.pdf" target="_blank" rel="noopener noreferrer" className="space-y-4">
        <CertificateSheet src={artcom} width={1222} height={870} alt="ARTCOM" />
        <CertificateSheet src={alcc} width={1222} height={870} alt="ALCC" />
        <CertificateSheet src={prattOrig} width={1222} height={870} alt="Pratt" />
        <CertificateSheet src={prattTrans} width={1694} height={870} alt="Pratt" />
      </a>
    </figure>
  );
}
