import { ToastId, UseToastOptions } from "@chakra-ui/react";

const showToast = (
    toast: (options?: UseToastOptions) => ToastId,
    title: string,
    description: string,
    status: "success" | "error" | "warning" | "info",
    duration: number,
    isClosable: boolean,
    position: "top-right" | "top-left" | "top" | "bottom" | "bottom-right" | "bottom-left"
) => {
    toast({
        title,
        description,
        status,
        duration,
        isClosable,
        position
    });
};

export default showToast;