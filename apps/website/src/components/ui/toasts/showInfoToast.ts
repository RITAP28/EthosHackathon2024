import { ToastId, UseToastOptions } from "@chakra-ui/react";

const showInfoToast = (
    toast: (options?: UseToastOptions) => ToastId,
    title: string,
    description: string
) => {
    toast({
        title,
        description,
        status: "info",
        duration: 3000,
        isClosable: true,
        position: "top-right"
    });
};

export default showInfoToast;