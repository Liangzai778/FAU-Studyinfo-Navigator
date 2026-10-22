type IconName =
  | 'dashboard'
  | 'degree'
  | 'planner'
  | 'exams'
  | 'resources'
  | 'settings'
  | 'sun'
  | 'moon'
  | 'globe'
  | 'external'
  | 'shield'
  | 'empty';

type IconProps = {
  name: IconName;
  className?: string;
};

const paths: Record<IconName, React.ReactNode> = {
  dashboard: <path d="M4 13h6V4H4v9Zm0 7h6v-4H4v4Zm10 0h6v-9h-6v9Zm0-16v4h6V4h-6Z" />,
  degree: <path d="m3 9 9-5 9 5-9 5-9-5Zm3 3.5V17l6 3 6-3v-4.5M21 9v6" />,
  planner: <path d="M6 3v3m12-3v3M4 9h16M5 5h14a1 1 0 0 1 1 1v14H4V6a1 1 0 0 1 1-1Zm3 8h3m2 0h3m-8 4h3m2 0h3" />,
  exams: <path d="M6 3h12v18H6V3Zm3 5h6m-6 4h6m-6 4h4M4 7H2m2 5H2m2 5H2" />,
  resources: <path d="M4 5a2 2 0 0 1 2-2h5v17H6a2 2 0 0 0-2 2V5Zm16 0a2 2 0 0 0-2-2h-5v17h5a2 2 0 0 1 2 2V5Z" />,
  settings: <path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Zm8-3.5 2-1-2-3-2.2.4a8 8 0 0 0-1.3-.8L16 4h-4l-.5 2.6a8 8 0 0 0-1.3.8L8 7 6 10l2 1a8 8 0 0 0 0 2l-2 1 2 3 2.2-.4a8 8 0 0 0 1.3.8L12 20h4l.5-2.6a8 8 0 0 0 1.3-.8L20 17l2-3-2-1a8 8 0 0 0 0-2Z" />,
  sun: <path d="M12 4V2m0 20v-2m8-8h2M2 12h2m13.7-5.7 1.4-1.4M4.9 19.1l1.4-1.4m11.4 0 1.4 1.4M4.9 4.9l1.4 1.4M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10Z" />,
  moon: <path d="M20 15.3A8.5 8.5 0 0 1 8.7 4 8.5 8.5 0 1 0 20 15.3Z" />,
  globe: <path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0 0c2.2-2.4 3.4-5.4 3.4-9S14.2 5.4 12 3c-2.2 2.4-3.4 5.4-3.4 9s1.2 6.6 3.4 9ZM3.5 9h17m-17 6h17" />,
  external: <path d="M14 4h6v6m0-6-9 9M10 6H5a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-5" />,
  shield: <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Zm-3-10 2 2 4-5" />,
  empty: <path d="M4 7h16v12H4V7Zm3-3h10v3M8 12h8m-5 4h2" />,
};

export function Icon({ name, className = 'h-5 w-5' }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill={name === 'dashboard' ? 'currentColor' : 'none'}
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {paths[name]}
    </svg>
  );
}
