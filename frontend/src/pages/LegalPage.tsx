import { ArrowLeft, Crown } from "lucide-react";
import { Link } from "react-router-dom";

import { Footer } from "@/components/Footer";
import { PageDots } from "@/components/PageDots";
import { Button } from "@/components/ui/button";

const LAST_UPDATED = "November 2, 2026";

type LegalSection = {
  title: string;
  paragraphs: string[];
};

const DOCUMENTS: Record<"privacy" | "terms", { title: string; intro: string; sections: LegalSection[] }> = {
  privacy: {
    title: "Privacy Policy",
    intro: "This policy describes how Chess Coach handles information when you use this chess-coaching project.",
    sections: [
      {
        title: "Information handled by the app",
        paragraphs: [
          "Chess Coach does not ask you to create an account or enter a name, email address, or other profile information. To keep a game available during your browser tab session, the app stores a random session identifier and the current game identifier in your browser's session storage. The session identifier is sent to the Chess Coach API to associate your requests with your games.",
          "When you play, the app processes and stores game information such as moves, board positions, game settings, status, and timestamps in its SQLite database. The database also stores cached chess commentary and related position-analysis facts so the app can reuse explanations. This project does not currently provide an in-app control to delete server-stored game records. Clearing browser session storage removes the local identifiers but does not delete records already stored by the server.",
          "When commentary is requested, relevant chess position facts and move information are sent to Google's Gemini service to generate an explanation. The app's configured Stockfish engine analyzes positions. Do not include personal or sensitive information in chess moves or other content you submit. Google's handling of requests is governed by Google's applicable terms and privacy information.",
        ],
      },
      {
        title: "Cookies, analytics, and technical logs",
        paragraphs: [
          "The app uses browser session storage for game identifiers; this is browser storage, not a persistent account profile. The project code does not implement advertising or analytics tracking. The hosting provider, browser, or infrastructure used to operate the app may process technical request data, such as network and error logs, under their own practices; the exact logs and retention depend on the deployment.",
        ],
      },
      {
        title: "Purpose and retention",
        paragraphs: [
          "Game and commentary data is used to run games, restore an active session, produce explanations, and reuse cached commentary. Server-side retention depends on the deployment's database and maintenance practices; no fixed deletion schedule is configured by the app. Contact the project maintainer through the channel where you accessed the app to ask about a data request or deletion. Whether a request can be fulfilled may depend on the deployment and applicable law.",
        ],
      },
      {
        title: "Your choices and changes",
        paragraphs: [
          "You can end the browser session or clear this site's session storage in your browser, which removes the local session and game identifiers. This does not remove server-side game data. Privacy rights vary by location; use the project maintainer contact channel for questions or requests. This policy may be updated as the app or its deployment changes; the date above indicates the latest revision.",
        ],
      },
    ],
  },
  terms: {
    title: "Terms of Service",
    intro: "By accessing or using Chess Coach, you agree to these terms. If you do not agree, do not use the app.",
    sections: [
      {
        title: "What the service does",
        paragraphs: [
          "Chess Coach is an educational chess-playing and analysis project. It lets you play against Stockfish and may provide explanations generated with Google's Gemini service, alongside engine-verified facts or template-based commentary. Commentary and engine analysis are informational aids, may be incomplete or incorrect, and are not a substitute for your own judgment or professional advice.",
        ],
      },
      {
        title: "Acceptable use",
        paragraphs: [
          "Use the app lawfully and do not interfere with its operation, attempt unauthorized access, or use it to transmit unlawful or harmful material. Do not rely on the app for uninterrupted, secure, or error-free service. The project may limit, suspend, or change access when needed to protect the service or its users.",
        ],
      },
      {
        title: "Third-party services",
        paragraphs: [
          "The app relies on third-party technology, including Stockfish and Google's Gemini service. Those services may have their own terms, availability limits, and privacy practices. Chess Coach is not affiliated with Stockfish or Google and does not control third-party services.",
        ],
      },
      {
        title: "Availability and disclaimers",
        paragraphs: [
          "The app is provided on an 'as is' and 'as available' basis, without warranties to the extent permitted by applicable law. The project does not guarantee that games, saved state, analysis, or commentary will be available, accurate, uninterrupted, or retained. You are responsible for deciding whether an explanation or move is suitable for your use.",
        ],
      },
      {
        title: "Liability and changes",
        paragraphs: [
          "To the extent permitted by applicable law, the project maintainers are not liable for indirect, incidental, special, consequential, or punitive loss arising from use of or inability to use the app. Nothing in these terms limits liability that cannot legally be limited. These terms may be updated as the project changes; continued use after an update means you accept the revised terms. Applicable law may provide rights that override parts of these terms.",
        ],
      },
    ],
  },
};

export function LegalPage({ document }: { document: "privacy" | "terms" }) {
  const content = DOCUMENTS[document];

  return (
    <>
      <div className="relative">
        <PageDots />
        <main className="mx-auto flex w-full max-w-3xl flex-col gap-8 pb-16">
          <div className="pt-2">
            <Button asChild variant="ghost" size="sm">
              <Link to="/">
                <ArrowLeft className="mr-1 h-4 w-4" />
                Back
              </Link>
            </Button>
          </div>

          <header className="border-b border-border pb-8">
            <div className="mb-4 flex items-center gap-2 text-primary">
              <Crown className="h-5 w-5" />
              <span className="font-mono text-xs font-semibold uppercase tracking-[0.16em]">Chess Coach · Legal</span>
            </div>
            <h1 className="font-heading text-4xl tracking-tight">{content.title}</h1>
            <p className="mt-4 text-sm text-muted-foreground">Last updated: {LAST_UPDATED}</p>
            <p className="mt-5 text-base leading-relaxed text-muted-foreground">{content.intro}</p>
          </header>

          <div className="space-y-8">
            {content.sections.map((section) => (
              <section key={section.title}>
                <h2 className="font-heading text-xl">{section.title}</h2>
                <div className="mt-3 space-y-3 text-sm leading-7 text-muted-foreground">
                  {section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
                </div>
              </section>
            ))}
          </div>
        </main>
      </div>
      <Footer transparent />
    </>
  );
}
