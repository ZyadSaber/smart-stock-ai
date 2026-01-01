import { useState, useCallback } from "react";

const useVisibility = () => {
  const [visible, setVisible] = useState(false);

  const handleOpen = useCallback(() => {
    setVisible(true);
  }, []);

  const handleClose = useCallback(() => {
    setVisible(false);
  }, []);

  const handleStateChange = useCallback((state: boolean) => {
    setVisible(state);
  }, []);

  return { visible, handleOpen, handleClose, handleStateChange };
};

export default useVisibility;
