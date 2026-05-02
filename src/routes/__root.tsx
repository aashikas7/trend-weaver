import { Outlet, Link, createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";
import { LangProvider } from "@/lib/lang-context";

import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { name: "theme-color", content: "#e85a2c" },
      { title: "ShareChat ट्रेंडिंग — आज भारत क्या देख रहा है" },
      { name: "description", content: "AI-संचालित रियल-टाइम ट्रेंडिंग टॉपिक्स — क्रिकेट, मनोरंजन, समाचार, त्योहार और वायरल मोमेंट्स।" },
      { property: "og:title", content: "ShareChat ट्रेंडिंग — आज भारत क्या देख रहा है" },
      { property: "og:description", content: "AI-संचालित रियल-टाइम ट्रेंडिंग टॉपिक्स — क्रिकेट, मनोरंजन, समाचार, त्योहार और वायरल मोमेंट्स।" },
      { property: "og:type", content: "website" },
      { name: "twitter:title", content: "ShareChat ट्रेंडिंग — आज भारत क्या देख रहा है" },
      { name: "twitter:description", content: "AI-संचालित रियल-टाइम ट्रेंडिंग टॉपिक्स — क्रिकेट, मनोरंजन, समाचार, त्योहार और वायरल मोमेंट्स।" },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/c56c4f0b-5fc6-4928-bae9-c4bceed36ebe/id-preview-8087a579--5ac49887-8766-420d-90bc-e83fcc151548.lovable.app-1777738541233.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/c56c4f0b-5fc6-4928-bae9-c4bceed36ebe/id-preview-8087a579--5ac49887-8766-420d-90bc-e83fcc151548.lovable.app-1777738541233.png" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Noto+Sans:wght@400;500;600;700;800;900&family=Noto+Sans+Devanagari:wght@400;500;600;700;800;900&family=Noto+Sans+Tamil:wght@400;500;600;700;800;900&family=Noto+Sans+Telugu:wght@400;500;600;700;800;900&family=Noto+Sans+Bengali:wght@400;500;600;700;800;900&family=Noto+Sans+Kannada:wght@400;500;600;700;800;900&family=Noto+Sans+Malayalam:wght@400;500;600;700;800;900&family=Noto+Sans+Gujarati:wght@400;500;600;700;800;900&family=Noto+Sans+Gurmukhi:wght@400;500;600;700;800;900&family=Noto+Sans+Oriya:wght@400;500;600;700;800;900&display=swap",
      },
      { rel: "stylesheet", href: appCss },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  return (
    <LangProvider>
      <Outlet />
    </LangProvider>
  );
}
