const explorerUrl = process.env.NEXT_PUBLIC_BLOCK_EXPLORER_URL;

export function ScannerLink({
  address,
  children,
  className,
}: {
  address: string;
  children?: React.ReactNode;
  className?: string;
}) {
  const content = children ?? address;

  if (!explorerUrl) {
    return <>{content}</>;
  }

  return (
    <a
      href={`${explorerUrl.replace(/\/?$/, "/")}${address}`}
      target="_blank"
      rel="noopener noreferrer"
      className={className ?? "hover:text-purple-100 transition-colors underline"}
    >
      {content}
    </a>
  );
}
