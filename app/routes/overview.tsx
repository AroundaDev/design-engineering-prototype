import { useEffect, useState } from "react";
import { Link } from "react-router";
import type { Route } from "./+types/overview";
import { AlertsByScanType } from "~/components/overview/AlertsByScanType";
import { MisconfigGauge } from "~/components/overview/MisconfigGauge";
import { PriorityInsights } from "~/components/overview/PriorityInsights";
import { OpenVsResolved } from "~/components/overview/OpenVsResolved";
import { SecretsFunnel } from "~/components/overview/SecretsFunnel";
import { SendIcon } from "~/components/ui/icons";
import { MISCONFIG_SCORE } from "~/data/overview";
import { useEntered } from "~/lib/motion";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Security Overview · Security platform" },
    { name: "description", content: "Security overview dashboard prototype" },
  ];
}

const NAME = "Ariel";

function greeting(hour: number) {
  return hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
}

export default function Overview() {
  const entered = useEntered(); // card entrance (.in .rv)
  const bars = useEntered(120); // bars grow slightly after cards start
  const gauge = useEntered(200); // gauge sweep + count-up
  // Time-of-day greeting is computed on the client to avoid a hydration mismatch.
  const [greet, setGreet] = useState("");
  useEffect(() => setGreet(`${greeting(new Date().getHours())}, ${NAME}`), []);

  return (
    <section className={`screen${entered ? " in" : ""}`} aria-label="Security overview">
      <div className="ov-head rv">
        <div>
          <p className="greet">{greet}</p>
          <h1>Security Overview</h1>
        </div>
        <Link className="askcard" to="/chat">
          <span className="orb" />
          <p>
            <b>Hi, {NAME}!</b> <span>Can I help</span>
            <br />
            <span>you with anything?</span>
          </p>
          <span className="send"><SendIcon /></span>
        </Link>
      </div>

      <div className="ov-grid">
        <AlertsByScanType grow={bars} delay={0.05} />
        <MisconfigGauge score={MISCONFIG_SCORE} run={gauge} delay={0.12} />
        <PriorityInsights delay={0.19} />
        <OpenVsResolved run={entered} delay={0.26} />
        <SecretsFunnel run={entered} delay={0.33} />
      </div>
    </section>
  );
}
