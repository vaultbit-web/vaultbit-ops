import { CaptacionFooter } from "~/components/captacion-90d/captacion-footer";
import { CaptacionTabs } from "~/components/captacion-90d/captacion-tabs";

export default function CaptacionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-6">
      <CaptacionTabs />
      <div>{children}</div>
      <CaptacionFooter />
    </div>
  );
}
