import { cn } from "@/lib/cn";

type SpinnerProps = React.SVGProps<SVGSVGElement> & { "aria-label"?: string };

export function Spinner({ className, ...props }: SpinnerProps) {
  return (
    <svg
      role="status"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden={props["aria-label"] ? undefined : true}
      className={cn("animate-spin", className)}
      {...props}
    >
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeOpacity="0.25"
        strokeWidth="4"
      />
      <path
        d="M12 2a10 10 0 0 1 10 10"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
      />
    </svg>
  );
}