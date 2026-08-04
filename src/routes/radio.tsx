import { createFileRoute, redirect } from "@tanstack/react-router";

/** Radio was renamed Club Mode — keep the old URL working. */
export const Route = createFileRoute("/radio")({
  beforeLoad: () => {
    throw redirect({ to: "/club" });
  },
});
