import type { PropsWithChildren } from "react";
import { MessagingHeader } from "./header";

// layout for the messaging page
const MessagingLayout = ({ children }: PropsWithChildren) => {
  return (
    <div className="flex min-h-screen flex-col">
      <MessagingHeader />

      <main className="flex flex-1 flex-col bg-white">
        {children}
      </main>
    </div>
  );
};

export default MessagingLayout;