import { type RouteConfig, index, layout, route } from "@react-router/dev/routes";

export default [
  layout("routes/shell.tsx", [
    index("routes/overview.tsx"),
    // Not ported yet: one placeholder module, distinguished by route id.
    route("findings", "routes/findings.tsx"),
    route("posture", "routes/posture.tsx"),
    route("chat", "routes/coming-soon.tsx", { id: "chat" }),
  ]),
] satisfies RouteConfig;
