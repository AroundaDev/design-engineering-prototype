import { Link } from "react-router";
import { Card } from "~/components/ui/Card";
import { FUNNEL_STAGES, findingsHref } from "~/data/overview";

export function SecretsFunnel({ run, delay }: { run: boolean; delay: number }) {
  return (
    <Card
      title="Secrets Prioritization"
      className="wide"
      delay={delay}
      icon={
        <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2}>
          <circle cx="8" cy="12" r="4" />
          <path d="M12 12h9M18 12v3M21 12v2" />
        </svg>
      }
    >
      <svg className={`funnel${run ? " in" : ""}`} viewBox="0 0 900 360" preserveAspectRatio="none" aria-hidden="true">
        <defs>
          <linearGradient id="fg" x1="0" x2="1">
            <stop offset="0" stopColor="#FF7A1A" stopOpacity=".9" />
            <stop offset=".55" stopColor="#FF6A10" stopOpacity=".55" />
            <stop offset="1" stopColor="#FF6A10" stopOpacity="0" />
          </linearGradient>
          <filter id="fb">
            <feGaussianBlur stdDeviation="6" />
          </filter>
        </defs>
        <path
          className="fpath"
          d="M0 165 L210 165 C240 165 240 188 270 190 L430 196 C460 197 460 208 490 209 L650 214 C680 215 680 224 710 225 L900 232 L900 246 L710 252 C680 253 680 262 650 263 L490 270 C460 271 460 284 430 285 L270 292 C240 293 240 312 210 312 L0 312 Z"
          fill="url(#fg)"
          filter="url(#fb)"
        />
        <path
          d="M0 214 L210 214 C250 214 250 226 290 227 L470 232 C500 233 500 236 530 236 L900 239 L900 243 L530 245 C500 245 500 249 470 250 L290 255 C250 256 250 266 210 266 L0 266Z"
          fill="#FFC870"
          opacity=".45"
          filter="url(#fb)"
        />
      </svg>
      <div className="stages">
        {FUNNEL_STAGES.map((s) => (
          <div className="stage" key={s.label}>
            <Link to={findingsHref(s.filter)}>
              <b>{s.value}</b>
              <small>{s.label}</small>
            </Link>
          </div>
        ))}
      </div>
    </Card>
  );
}
