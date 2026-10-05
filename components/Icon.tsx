"use client";

import { config } from "@fortawesome/fontawesome-svg-core";
import "@fortawesome/fontawesome-svg-core/styles.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowDown,
  faArrowRight,
  faEnvelope,
  faImage,
  faQuoteLeft,
  faStar,
} from "@fortawesome/free-solid-svg-icons";
import {
  faBehance,
  faFacebookF,
  faInstagram,
  faLinkedinIn,
  faWhatsapp,
  faYoutube,
} from "@fortawesome/free-brands-svg-icons";

config.autoAddCss = false;

const icons = {
  whatsapp: faWhatsapp,
  envelope: faEnvelope,
  arrowDown: faArrowDown,
  arrowRight: faArrowRight,
  image: faImage,
  quoteLeft: faQuoteLeft,
  star: faStar,
  facebook: faFacebookF,
  instagram: faInstagram,
  behance: faBehance,
  linkedin: faLinkedinIn,
  youtube: faYoutube,
};

export type IconName = keyof typeof icons;

export default function Icon({
  name,
  className,
}: {
  name: IconName;
  className?: string;
}) {
  return <FontAwesomeIcon icon={icons[name]} className={className} />;
}