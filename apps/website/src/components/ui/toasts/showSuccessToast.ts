import { ToastId, UseToastOptions } from "@chakra-ui/react";

const showSuccessToast = (
    toast: (options?: UseToastOptions) => ToastId,
    title: string,
    description: string
) => {
    toast({
        title,
        description,
        status: "success",
        duration: 3000,
        isClosable: true,
        position: "top-right"
    });
};

export default showSuccessToast;