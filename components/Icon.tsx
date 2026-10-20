"use client";

import { config } from "@fortawesome/fontawesome-svg-core";
import "@fortawesome/fontawesome-svg-core/styles.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowDown,
  faArrowRight,
  faArrowUpRightFromSquare,
  faBagShopping,
  faBars,
  faBell,
  faBoxesStacked,
  faCartShopping,
  faCheck,
  faEnvelope,
  faGaugeHigh,
  faGear,
  faHouse,
  faImage,
  faMagnifyingGlass,
  faMinus,
  faPaintbrush,
  faPlus,
  faQuoteLeft,
  faReceipt,
  faRightFromBracket,
  faStar,
  faTrash,
  faUser,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import {
  faBehance,
  faFacebookF,
  faGoogle,
  faInstagram,
  faLinkedinIn,
  faWhatsapp,
  faYoutube,
  faChevronLeft,
  faChevronRight,
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
  bars: faBars,
  xmark: faXmark,
  search: faMagnifyingGlass,
  house: faHouse,
  bag: faBagShopping,
  brush: faPaintbrush,
  cart: faCartShopping,
  user: faUser,
  trash: faTrash,
  plus: faPlus,
  minus: faMinus,
  check: faCheck,
  google: faGoogle,
  gauge: faGaugeHigh,
  catalog: faBoxesStacked,
  receipt: faReceipt,
  gear: faGear,
  bell: faBell,
  logout: faRightFromBracket,
  external: faArrowUpRightFromSquare,
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
