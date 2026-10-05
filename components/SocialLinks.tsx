import Icon from "@/components/Icon";
import { Socials, socialKeys, socialLabels } from "@/lib/settingsTypes";

export default function SocialLinks({
  socials,
  className = "",
}: {
  socials: Socials;
  className?: string;
}) {
  const active = socialKeys.filter((key) => socials[key]);
  if (active.length === 0) return null;

  return (
    <div className={`flex flex-wrap gap-3 ${className}`}>
      {active.map((key) => (
        <a
          key={key}
          href={socials[key]}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={socialLabels[key]}
          className="icon-btn"
        >
          <Icon name={key} />
        </a>
      ))}
    </div>
  );
}