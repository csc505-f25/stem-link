import type { PropsWithChildren } from "react";
import { QuestionHeader } from "./header";

// layout for the question page
const QuestionLayout = ({ children }: PropsWithChildren) => {
  return (
    <div className="flex min-h-screen flex-col">
      <QuestionHeader />

      <main className="flex flex-1 flex-col bg-white">
        {children}
      </main>
    </div>
  );
};

export default QuestionLayout;