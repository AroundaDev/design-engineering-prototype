import { type RouteConfig, index, layout, route } from "@react-router/dev/routes";

export default [
  layout("routes/shell.tsx", [
    index("routes/overview.tsx"),
    route("findings", "routes/findings.tsx"),
    route("posture", "routes/posture.tsx"),
    route("chat", "routes/chat.tsx"),
  ]),
] satisfies RouteConfig;
