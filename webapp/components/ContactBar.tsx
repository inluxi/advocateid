import { Button } from "@/components/Button";

function waLink(number: string) {
  return `https://wa.me/${number.replace(/[^\d]/g, "")}`;
}
function telLink(number: string) {
  return `tel:${number}`;
}

/** WhatsApp + Call — the profile schema has no email field, so the design's 3-up action bar becomes 2-up here. */
export function ContactBar({
  whatsappNumber,
  contactHours,
  variant = "primary",
}: {
  whatsappNumber: string;
  contactHours?: string | null;
  variant?: "primary" | "on-colour";
}) {
  return (
    <div className="flex flex-col gap-3 border-t-2 border-ink bg-bg px-[18px] py-4 desktop:flex-row desktop:items-center desktop:justify-between desktop:border-t-0 desktop:px-0 desktop:py-0">
      <div className="flex gap-2">
        <Button href={waLink(whatsappNumber)} variant={variant === "on-colour" ? "on-colour" : "primary"} size="lg" fullWidth>
          WhatsApp
        </Button>
        <Button href={telLink(whatsappNumber)} variant="secondary" size="lg" fullWidth>
          Call
        </Button>
      </div>
      {contactHours ? <p className="whitespace-nowrap text-small text-ink-700">{contactHours}</p> : null}
    </div>
  );
}
