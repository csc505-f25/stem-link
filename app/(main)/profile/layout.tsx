import type { PropsWithChildren } from "react";
import { ProfileHeader } from "./header";

// layout for the profile page
const ProfileLayout = ({ children }: PropsWithChildren) => {
  return (
    <div className="flex min-h-screen flex-col">
      <ProfileHeader />

      <main className="flex flex-1 flex-col bg-white">
        {children}
      </main>
    </div>
  );
};

export default ProfileLayout;