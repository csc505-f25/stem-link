import type { PropsWithChildren } from "react";
import { LearnHeader } from "./header";

// layout for the learn page
const LearnLayout = ({ children }: PropsWithChildren) => {
  return (
    <div className="flex min-h-screen flex-col">
      <LearnHeader />

      <main className="flex flex-1 flex-col bg-white">
        {children}
      </main>
    </div>
  );
};

export default LearnLayout;