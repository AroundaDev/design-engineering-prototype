import type { IconName } from "~/components/ui/icons";

export type Severity = "critical" | "high" | "medium" | "low";

export type Finding = {
  id: string;
  title: string;
  cat: string;
  sev: Severity;
  type: string;
  typeSub: string;
  icon: IconName;
  asset: string;
  age: string;
  finding: string;
  scan: string;
  repo: string;
  file: string;
  branch: string;
  by: string;
  ref: string;
  code: string[];
  /** Zero-based index of the highlighted line in `code`. */
  hl: number;
};

export const FINDINGS: Finding[] = [
  {
    id: "FND-8f3a9c11", title: "AWS Access Key Exposed", cat: "Secret", sev: "critical", type: "Secrets", typeSub: "Secrets Scan", icon: "secret",
    asset: "payment-service", age: "2 days", finding: "Hardcoded AWS access key", scan: "Secrets detection", repo: "payments-api",
    file: "config/aws-credentials.ts:14", branch: "main, protected", by: "j.rivera@company.com", ref: "CWE-798",
    code: [
      'import { S3Client } from "@aws-sdk/client-s3";',
      "",
      "export const s3 = new S3Client({",
      '  region: "eu-west-1",',
      "  credentials: {",
      '    accessKeyId: "AKIA4X7Q••••••••T2KQ",',
      '    secretAccessKey: "wJalr••••••••••••EKEY",',
      "  },",
      "});",
    ],
    hl: 5,
  },
  {
    id: "FND-2c71de04", title: "Hardcoded JWT Secret", cat: "Secret", sev: "critical", type: "Secrets", typeSub: "Secrets Scan", icon: "secret",
    asset: "auth-service", age: "5 days", finding: "JWT signing secret in source", scan: "Secrets detection", repo: "auth-api",
    file: "src/config/jwt.ts:7", branch: "main, protected", by: "m.chen@company.com", ref: "CWE-321",
    code: [
      'import jwt from "jsonwebtoken";',
      "",
      "// TODO: move to vault",
      'const SECRET = "sup3r-••••••••-k3y";',
      "",
      "export const sign = (p) => jwt.sign(p, SECRET);",
    ],
    hl: 3,
  },
  {
    id: "FND-91b0aa37", title: "SQL Injection in /user/id", cat: "SAST", sev: "high", type: "SAST", typeSub: "SAST Scan", icon: "sast",
    asset: "user-service", age: "7 days", finding: "Unparameterized SQL query", scan: "Static analysis", repo: "user-api",
    file: "src/routes/user.ts:42", branch: "develop", by: "a.novak@company.com", ref: "CWE-89",
    code: [
      'router.get("/user/:id", async (req, res) => {',
      "  const q = `SELECT * FROM users WHERE id = ${req.params.id}`;",
      "  const rows = await db.query(q);",
      "  res.json(rows[0]);",
      "});",
    ],
    hl: 1,
  },
  {
    id: "FND-4e8f12b9", title: "Outdated Dependency: log4j", cat: "SCA", sev: "medium", type: "SCA", typeSub: "SCA Scan", icon: "sca",
    asset: "backend", age: "12 days", finding: "log4j-core 2.14.1 (CVE-2021-44228)", scan: "Dependency scan", repo: "backend-core",
    file: "pom.xml:88", branch: "main", by: "dependabot", ref: "CVE-2021-44228",
    code: [
      "<dependency>",
      "  <groupId>org.apache.logging.log4j</groupId>",
      "  <artifactId>log4j-core</artifactId>",
      "  <version>2.14.1</version>",
      "</dependency>",
    ],
    hl: 3,
  },
  {
    id: "FND-c03d5e61", title: "Protected Branch Allows Force Push", cat: "SCM-PM", sev: "medium", type: "SCM-PM", typeSub: "SCM-PM Scan", icon: "scm",
    asset: "fintech-app", age: "15 days", finding: "Force push enabled on main", scan: "SCM posture", repo: "fintech-app",
    file: "Branch protection · main", branch: "main", by: "org-admin", ref: "CIS 1.1.7",
    code: ["branch: main", "protection:", "  required_reviews: 1", "  allow_force_pushes: true", "  allow_deletions: false"],
    hl: 3,
  },
  {
    id: "FND-7a6b2f08", title: "CORS Misconfiguration", cat: "SAST", sev: "low", type: "SAST", typeSub: "SAST Scan", icon: "sast",
    asset: "api-gateway", age: "16 days", finding: "Wildcard origin with credentials", scan: "Static analysis", repo: "api-gateway",
    file: "src/server.ts:21", branch: "main", by: "k.ito@company.com", ref: "CWE-942",
    code: ["app.use(cors({", '  origin: "*",', "  credentials: true,", "}));"],
    hl: 1,
  },
  {
    id: "FND-e5f9c3a2", title: "Public S3 Bucket Policy", cat: "IaC", sev: "high", type: "IaC", typeSub: "IaC Scan", icon: "iac",
    asset: "data-lake", age: "3 days", finding: "Bucket readable by everyone", scan: "Infrastructure as code", repo: "infra-terraform",
    file: "modules/s3/main.tf:33", branch: "main", by: "s.patel@company.com", ref: "CIS AWS 2.1.5",
    code: [
      'resource "aws_s3_bucket_policy" "lake" {',
      "  bucket = aws_s3_bucket.lake.id",
      "  policy = jsonencode({",
      '    Statement = [{ Effect = "Allow", Principal = "*",',
      '      Action = "s3:GetObject" }]',
      "  })",
      "}",
    ],
    hl: 3,
  },
  {
    id: "FND-0d44b7e3", title: "Stripe Test Key in Repository", cat: "Secret", sev: "medium", type: "Secrets", typeSub: "Secrets Scan", icon: "secret",
    asset: "billing-worker", age: "9 days", finding: "Stripe test key committed", scan: "Secrets detection", repo: "billing-worker",
    file: ".env.example:4", branch: "main", by: "l.garcia@company.com", ref: "CWE-798",
    code: ["NODE_ENV=development", "PORT=8080", "", "STRIPE_KEY=sk_test_51H••••••••••••Xa"],
    hl: 3,
  },
];

/** Finding opened automatically on the first visit, as in the prototype. */
export const FEATURED_ID = "FND-8f3a9c11";

export const SEVERITIES: Severity[] = ["critical", "high", "medium", "low"];

export function findingById(id: string | null | undefined) {
  return id ? FINDINGS.find((f) => f.id === id) : undefined;
}

export const cap = (s: string) => s[0].toUpperCase() + s.slice(1);

/** Headline numbers, adjusted by what the visitor resolved in this demo. */
export function totals(resolvedIds: string[]) {
  const r = resolvedIds.map(findingById).filter((f): f is Finding => !!f);
  const crit = r.filter((f) => f.sev === "critical").length;
  const high = r.filter((f) => f.sev === "high").length;
  return {
    total: 4389,
    crit: 312 - crit,
    high: 1203 - high,
    res: 1843 + r.length,
    // Posture center
    active: 1466 - r.length,
    activeCrit: 128 - crit,
    activeHigh: 612 - high,
    fixed: 612 + r.length,
    resolved: 1055 + r.length,
  };
}
