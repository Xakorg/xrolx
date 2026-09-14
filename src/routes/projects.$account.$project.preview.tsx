import { createFileRoute, redirect } from "@tanstack/react-router";

// Owner preview now lives at /p/:account/:project (works for both owner and public).
// Keep this route as a permanent redirect for any old saved links.
export const Route = createFileRoute("/projects/$account/$project/preview")({
  loader: ({ params }) => {
    throw redirect({
      to: "/p/$account/$project",
      params: { account: params.account, project: params.project },
      replace: true,
    });
  },
  component: () => null,
});
