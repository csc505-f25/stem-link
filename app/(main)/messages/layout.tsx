import type { PropsWithChildren } from "react";
import { MessagesHeader } from "./header";

// layout for the messaging page
const MessagesLayout = ({ children }: PropsWithChildren) => {
  return (
    <div className="flex min-h-screen flex-col">
      <MessagesHeader />

      <main className="flex flex-1 flex-col bg-white">
        {children}
      </main>
    </div>
  );
};

export default MessagesLayout;