import { useRef } from "react";
import { message, Button } from "antd";

export default function useUndoSnackbar({ timeout = 5000 }) {
  const pendingRef = useRef(null);

  const showUndo = ({ label, onUndo, onCommit }) => {
    if (pendingRef.current) {
      clearTimeout(pendingRef.current.timer);
      pendingRef.current = null;
    }

    const key = `undo-${Date.now()}`;

    const timer = setTimeout(() => {
      message.destroy(key);
      onCommit();
      pendingRef.current = null;
    }, timeout);

    pendingRef.current = { timer };

    message.open({
      key,
      duration: timeout / 1000,
      content: (
        <span>
          {label}
          <Button
            type="link"
            size="small"
            onClick={() => {
              clearTimeout(timer);
              message.destroy(key);
              pendingRef.current = null;
              onUndo();
            }}
          >
            UNDO
          </Button>
        </span>
      ),
    });
  };

  return { showUndo };
}
