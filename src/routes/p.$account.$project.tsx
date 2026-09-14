import { createFileRoute, notFound } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { getPublishedProject } from "@/lib/projects.functions";
import { bundlePreview } from "@/lib/xrolxBuilder";

export const Route = createFileRoute("/p/$account/$project")({
  loader: async ({ params }) => {
    const data = await getPublishedProject({
      data: { account: params.account, slug: params.project },
    });
    if (!data) throw notFound();
    return data;
  },
  head: ({ loaderData, params }) => ({
    meta: [
      {
        title: loaderData
          ? `${loaderData.name} — by ${loaderData.displayName ?? loaderData.account}`
          : `${params.project} — Xrolx`,
      },
      {
        name: "description",
        content: loaderData
          ? `${loaderData.name}, a project by ${loaderData.displayName ?? loaderData.account} on Xrolx.`
          : "A published Xrolx project.",
      },
    ],
  }),
  component: PublicProjectPage,
  notFoundComponent: () => (
    <div className="min-h-screen flex items-center justify-center bg-background text-foreground p-6 text-center">
      <div className="max-w-md">
        <h1 className="text-2xl font-semibold">Project not found</h1>
        <p className="text-sm text-muted-foreground mt-2">
          This project doesn't exist or hasn't been published.
        </p>
        <a href="/" className="inline-block mt-4 text-sm text-mint hover:underline">
          ← Back to Xrolx
        </a>
      </div>
    </div>
  ),
  errorComponent: ({ error }) => (
    <div className="min-h-screen flex items-center justify-center bg-background text-foreground p-6 text-center">
      <div className="max-w-md">
        <h1 className="text-xl font-semibold">Couldn't load project</h1>
        <p className="text-sm text-muted-foreground mt-2">{error.message}</p>
      </div>
    </div>
  ),
});

function PublicProjectPage() {
  const data = Route.useLoaderData()!;
  const [tick] = useState(0);
  const src = useMemo(() => bundlePreview({ entry: data.entry, files: data.files }), [data]);

  return (
    <div className="h-screen w-screen flex flex-col bg-background">
      <iframe
        key={tick}
        title={data.name}
        sandbox="allow-scripts allow-forms allow-modals allow-popups allow-same-origin"
        srcDoc={src}
        className="flex-1 w-full border-0 bg-white"
      />
    </div>
  );
}
