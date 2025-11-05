import { Loader } from "lucide-react";

// loading component for the question page
const Loading = () => {
  return (
    <div className="flex h-full w-full items-center justify-center">
      <Loader className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  );
};

export default Loading;