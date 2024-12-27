import { SetStateAction, useState } from "react";
import showWarningToast from "../../toasts/showWarningToast";
import { useToast } from "@chakra-ui/react";
import { handleApiError } from "../../../../lib/error.handling";
import showErrorToast from "../../toasts/showErrorToast";
import axios from "axios";
import { baseUrl } from "../../../../utils/util";
import { CurrentChat } from "../../../../utils/interface";
import { useAppSelector } from "../../../../redux/hooks/hook";

const ImageModal = ({
  closeModal,
  currentChat,
  setOpenImageOption,
  setIsOptionSelected,
  textMessage,
  setTextMessage,
  handleSendButtonClick,
}: {
  closeModal: () => void;
  currentChat: CurrentChat;
  setOpenImageOption: React.Dispatch<SetStateAction<boolean>>;
  setIsOptionSelected: React.Dispatch<SetStateAction<boolean>>;
  textMessage: string;
  setTextMessage: React.Dispatch<React.SetStateAction<string>>;
  handleSendButtonClick: (
    receiverId: number,
    receiverName: string,
    receiverEmail: string,
    mediaUrl: string | null,
    textMetadata: string
  ) => Promise<void>;
}) => {
  const toast = useToast();
  const { accessToken } = useAppSelector((state) => state.user);
  const [image, setImage] = useState<File>();
  const [loading, setLoading] = useState<boolean>(false);
  const [imageUrl, setImageUrl] = useState<string>("");
  const formData = new FormData();

  if (image) formData.append("imageFile", image);
  if (textMessage) formData.append("caption", textMessage);

  const handleSubmitData = async (e: React.FormEvent<HTMLFormElement>) => {
    setLoading(true);
    console.log("formdata image transfer: ", formData);
    if (!image) {
      console.log("Please provide an image");
      showWarningToast(
        toast,
        "Please provide an image",
        "You clicked on Send without providing an image"
      );
      return;
    }
    e.preventDefault();
    try {
      const mediaResponse = await axios.post(`${baseUrl}/api/v1/upload/media`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${accessToken}`
        }
      });
      console.log("media response: ", mediaResponse.data);
      setImageUrl(mediaResponse.data.mediaUrl);

      await handleSendButtonClick(
        currentChat.receiverId,
        currentChat.receiverName,
        currentChat.receiverEmail,
        imageUrl,
        textMessage
      );
    } catch (error) {
      console.error(
        "Error while sending an axios request to the server regarding image transfer: ",
        error
      );
      const apiError = handleApiError(error);
      showErrorToast(toast, apiError.message, "Error while image transfer");
    }

    closeModal();
    setLoading(false);
  };

  return (
    <>
      <form action="" method="post" onSubmit={handleSubmitData}>
        <div className="w-full flex flex-row">
          <div className="w-[30%] pl-2 flex justify-end">Choose Image:</div>
          <div className="w-[70%] flex justify-start pl-4">
            <input
              type="file"
              className="w-full"
              id="imgInput"
              accept="image/*"
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                if (e.target.files && e.target.files[0]) {
                  setImage(e.target.files[0]);
                }
              }}
            />
          </div>
        </div>
        <div className="w-full flex flex-row py-2">
          <div className="w-[30%] pl-2 flex justify-end">
            Write Caption(optional):
          </div>
          <div className="w-[70%] flex justify-start pl-4">
            <input
              type="text"
              name="imgCaption"
              id="imgCaption"
              placeholder="Caption..."
              className="w-[80%] border-[1px] border-black rounded-md pl-2"
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                setTextMessage(e.target.value);
              }}
            />
          </div>
        </div>
        <div className="w-full flex flex-row items-center">
          <div className="basis-1/2 flex justify-end pr-2">
            <button
              type="button"
              className="px-4 py-1 rounded-md hover:cursor-pointer bg-slate-500 text-white hover:bg-slate-600 transition duration-150 ease-in-out"
              onClick={() => {
                setOpenImageOption(false);
                setIsOptionSelected(false);
              }}
            >
              Back
            </button>
          </div>
          <div className="basis-1/2 flex justify-start pl-2">
            <button
              type="submit"
              className="px-4 py-1 rounded-md hover:cursor-pointer bg-slate-500 text-white hover:bg-slate-600 transition duration-150 ease-in-out"
            >
              {loading ? "Sending..." : "Send"}
            </button>
          </div>
        </div>
      </form>
    </>
  );
};

export default ImageModal;
