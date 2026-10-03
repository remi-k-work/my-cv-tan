// components
import { Toast } from "@base-ui/react";
import { ToastList } from "./toast-list";

// types
import type { ReactNode } from "react";

interface ToastifyProps {
  children: ReactNode;
}

// constants
export const toastManager = Toast.createToastManager();

export function Toastify({ children }: ToastifyProps) {
  return (
    <Toast.Provider toastManager={toastManager}>
      {children}
      <Toast.Portal>
        <Toast.Viewport className="fixed top-auto right-4 bottom-4 z-1 mx-auto w-[calc(100vw-2rem)] sm:right-8 sm:bottom-8 sm:w-90">
          <ToastList />
        </Toast.Viewport>
      </Toast.Portal>
    </Toast.Provider>
  );
}
