import { useToast } from "@/components/ui/use-toast";
import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast";

export function Toaster() {
  const { toasts, dismiss } = useToast();
  const location = useLocation();

  useEffect(() => {
    dismiss();
  }, [location.pathname, dismiss]);

  return (
    <ToastProvider>
      <ToastViewport>
        {toasts.map(function ({ id, title, description, action, open, duration: _duration, onOpenChange: _onOpenChange, ...props }) {
          return (
            <Toast key={id} data-state={open ? "open" : "closed"} {...props}>
              <div className="grid gap-1">
                {title && <ToastTitle>{title}</ToastTitle>}
                {description && (
                  <ToastDescription>{description}</ToastDescription>
                )}
              </div>
              {action}
              <ToastClose onClick={() => dismiss(id)} />
            </Toast>
          );
        })}
      </ToastViewport>
    </ToastProvider>
  );
} 