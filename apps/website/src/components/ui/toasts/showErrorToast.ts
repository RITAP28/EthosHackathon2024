import { ToastId, UseToastOptions } from "@chakra-ui/react";

const showErrorToast = (
    toast: (options?: UseToastOptions) => ToastId,
    title: string,
    description: string
) => {
    toast({
        title,
        description,
        status: "error",
        duration: 3000,
        isClosable: true,
        position: "top-right"
    });
};

export default showErrorToast;