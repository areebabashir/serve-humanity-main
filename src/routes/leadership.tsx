import { Helmet } from "react-helmet-async";
import { SiteLayout } from "@/components/site/SiteLayout";
import { PageHero } from "@/components/site/PageHero";
import { Reveal } from "@/components/site/Reveal";
import { Linkedin, Mail, Phone } from "lucide-react";
import { highlightTitle, useWebsitePage } from "@/lib/websiteContent";

type Member = {
  name: string;
  role: string;
  phone?: string;
  email?: string;
  photoUrl?: string;
  linkedin?: string;
};

type LeadershipSections = {
  hero?: { eyebrow?: string; title?: string; titleHighlight?: string; description?: string };
  groups?: { title: string; members: Member[] }[];
};

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .map((s) => s[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function Avatar({ name, photoUrl }: { name: string; photoUrl?: string }) {
  return (
    <div className="relative mx-auto">
      <div className="absolute -inset-1 rounded-full bg-gradient-to-br from-brand-orange to-brand-accent opacity-90 blur-[2px] transition duration-500 group-hover:opacity-100 group-hover:blur-[3px]" />
      <div className="relative h-36 w-36 overflow-hidden rounded-full bg-gradient-warm p-[3px] shadow-warm md:h-40 md:w-40">
        <div className="h-full w-full overflow-hidden rounded-full bg-[#1a1a1a] ring-2 ring-white">
          {photoUrl ? (
            <img
              src={photoUrl}
              alt={name}
              className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="grid h-full w-full place-items-center bg-gradient-to-br from-[#2a2a2a] to-[#111] font-display text-3xl font-bold text-brand-orange md:text-4xl">
              {initials(name)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ContactIcons({ member }: { member: Member }) {
  const icons = [
    member.linkedin
      ? { href: member.linkedin, Icon: Linkedin, label: "LinkedIn", external: true }
      : null,
    member.phone
      ? {
          href: `tel:${member.phone.replace(/\s/g, "")}`,
          Icon: Phone,
          label: "Phone",
          external: false,
        }
      : null,
    member.email
      ? { href: `mailto:${member.email}`, Icon: Mail, label: "Email", external: false }
      : null,
  ].filter(Boolean) as {
    href: string;
    Icon: typeof Linkedin;
    label: string;
    external: boolean;
  }[];

  if (!icons.length) return null;

  return (
    <div className="mt-5 flex items-center justify-center gap-3">
      {icons.map(({ href, Icon, label, external }) => (
        <a
          key={label}
          href={href}
          {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
          aria-label={`${member.name} — ${label}`}
          title={label}
          className="grid h-10 w-10 place-items-center rounded-full border border-black/10 bg-white text-[#1a1a1a] shadow-soft transition-all duration-300 hover:-translate-y-1 hover:border-brand-orange hover:bg-brand-orange hover:text-white hover:shadow-warm"
        >
          <Icon className="h-[18px] w-[18px]" />
        </a>
      ))}
    </div>
  );
}

function PersonCard({ member, delay }: { member: Member; delay: number }) {
  return (
    <Reveal delay={delay}>
      <article className="group relative flex h-full flex-col items-center rounded-3xl border border-black/8 bg-white/90 p-6 text-center shadow-soft backdrop-blur-sm transition-all duration-500 hover:-translate-y-1.5 hover:border-brand-orange/40 hover:shadow-elevated">
        <div className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-brand-orange/60 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
        <Avatar name={member.name} photoUrl={member.photoUrl} />
        <h3 className="mt-5 font-display text-lg font-bold tracking-tight text-[#1a1a1a] md:text-xl">
          {member.name}
        </h3>
        <p className="mt-2.5 inline-flex rounded-full bg-brand-orange/15 px-4 py-1.5 text-sm font-semibold text-brand-accent md:text-[15px]">
          {member.role}
        </p>
        <ContactIcons member={member} />
      </article>
    </Reveal>
  );
}

function TeamSection({
  title,
  members,
  index,
}: {
  title: string;
  members: Member[];
  index: number;
}) {
  const count = members.length;
  const cols =
    count >= 5
      ? "sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5"
      : count === 4
        ? "sm:grid-cols-2 lg:grid-cols-4"
        : count === 3
          ? "sm:grid-cols-3"
          : count === 1
            ? "mx-auto max-w-sm"
            : "sm:grid-cols-2";

  return (
    <section className={`relative py-10 md:py-14 ${index % 2 === 1 ? "rounded-[2rem] bg-black/[0.03]" : ""}`}>
      <Reveal>
        <div className="mx-auto max-w-2xl text-center">
          <div className="mx-auto mb-4 h-1 w-12 rounded-full bg-gradient-warm" />
          <h2 className="font-display text-2xl font-bold tracking-tight text-[#1a1a1a] md:text-3xl">
            {title}
          </h2>
        </div>
      </Reveal>
      <div className={`mt-10 grid gap-5 md:gap-6 ${cols}`}>
        {members.map((m, i) => (
          <PersonCard key={`${m.name}-${m.role}`} member={m} delay={i} />
        ))}
      </div>
    </section>
  );
}

export default function Page() {
  const { sections, loading } = useWebsitePage<LeadershipSections>("leadership", { dbOnly: true });
  const hero = sections.hero ?? {};
  const groups = (sections.groups ?? []).filter((g) => (g.members?.length ?? 0) > 0);

  return (
    <>
      <Helmet>
        <title>Team — Serve Humanity</title>
        <meta
          name="description"
          content="Meet the founders, board, chapter presidents and executive team leading Serve Humanity."
        />
        <meta property="og:title" content="Team — Serve Humanity" />
        <meta property="og:url" content="/team" />
        <link rel="canonical" href="/team" />
      </Helmet>
      <SiteLayout>
        {loading ? (
          <section className="relative overflow-hidden pt-32 pb-14 md:pt-40 md:pb-20">
            <div className="pointer-events-none absolute inset-0 bg-mesh opacity-70" />
            <div className="container-page relative mx-auto max-w-3xl animate-pulse text-center" aria-busy="true">
              <div className="mx-auto h-7 w-28 rounded-full bg-brand-orange/15" />
              <div className="mx-auto mt-6 h-14 w-48 rounded-2xl bg-black/10 md:h-16" />
              <div className="mx-auto mt-5 h-4 w-full max-w-md rounded-full bg-black/5" />
            </div>
          </section>
        ) : (
          <PageHero
            eyebrow={hero.eyebrow || "Team"}
            title={highlightTitle(hero.title || "Team", hero.titleHighlight)}
            description={hero.description}
          />
        )}

        <section className="page-section">
          {loading ? (
            <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="animate-pulse rounded-3xl border border-black/8 bg-white/70 p-6">
                  <div className="mx-auto h-36 w-36 rounded-full bg-brand-orange/15" />
                  <div className="mx-auto mt-5 h-5 w-32 rounded-full bg-black/10" />
                  <div className="mx-auto mt-3 h-4 w-24 rounded-full bg-black/5" />
                </div>
              ))}
            </div>
          ) : groups.length === 0 ? (
            <p className="mx-auto max-w-md text-center text-sm text-muted-foreground">
              Team members will appear here once added in the website CMS.
            </p>
          ) : (
            groups.map((g, i) => (
              <TeamSection key={g.title} title={g.title} members={g.members || []} index={i} />
            ))
          )}
        </section>
      </SiteLayout>
    </>
  );
}
