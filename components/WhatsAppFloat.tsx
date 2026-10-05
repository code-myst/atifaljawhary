import Icon from "@/components/Icon";
import { getSettings } from "@/lib/getSettings";

export default async function WhatsAppFloat() {
  const settings = await getSettings();
  if (!settings.whatsappNumber) return null;

  return (
    <a
      href={`https://wa.me/${settings.whatsappNumber}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat on WhatsApp"
      className="whatsapp-float"
    >
      <Icon name="whatsapp" className="text-2xl" />
    </a>
  );
}