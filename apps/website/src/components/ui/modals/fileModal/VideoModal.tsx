import { SetStateAction, useState } from "react";
import showWarningToast from "../../toasts/showWarningToast";
import { useToast } from "@chakra-ui/react";
import { handleApiError } from "../../../../lib/error.handling";
import showErrorToast from "../../toasts/showErrorToast";
import axios from "axios";
import { baseUrl, createConfig } from "../../../../utils/util";
import { CurrentChat } from "../../../../utils/interface";
import { useAppSelector } from "../../../../redux/hooks/hook";

const VideoModal = ({
  closeModal,
  currentChat,
  setOpenImageOption,
  setIsOptionSelected,
}: {
  closeModal: () => void;
  currentChat: CurrentChat;
  setOpenImageOption: React.Dispatch<SetStateAction<boolean>>;
  setIsOptionSelected: React.Dispatch<SetStateAction<boolean>>;
}) => {
  const toast = useToast();
  const { currentUser, accessToken } = useAppSelector((state) => state.user);
  const config = createConfig(accessToken);
  const [video, setVideo] = useState<File>();
  const [caption, setCaption] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const formData = new FormData();

  if (video) formData.append("imageFile", video);
  if (caption) formData.append("caption", caption);

  const handleSubmitData = async (e: React.FormEvent<HTMLFormElement>) => {
    setLoading(true);
    console.log("formdata video transfer: ", formData);
    if (!video) {
      console.log("Please provide a video file");
      showWarningToast(
        toast,
        "Please provide a video",
        "You clicked on Send without providing a video file"
      );
      return;
    }
    e.preventDefault();

    try {
      const response = await axios.post(
        `${baseUrl}/api/v1/chat/transfer/video?senderId=${currentUser?.id}&receiverId=${currentChat.receiverId}`,
        formData,
        config
      );
      console.log("Video Transfer Data: ", response.data);
    } catch (error) {
      console.error(
        "Error while sending an axios request to the server regarding video transfer: ",
        error
      );
      const apiError = handleApiError(error);
      showErrorToast(toast, apiError.message, "Error while video transfer");
    }

    closeModal();
    setLoading(false);
  };

  return (
    <>
      <form action="" method="post" onSubmit={handleSubmitData}>
        <div className="w-full flex flex-row">
          <div className="w-[30%] pl-2 flex justify-end">Choose Video:</div>
          <div className="w-[70%] flex justify-start pl-4">
            <input
              type="file"
              className="w-full"
              id="vidInput"
              accept="video/*"
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                if (e.target.files && e.target.files[0]) {
                  setVideo(e.target.files[0]);
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
              name="vidCaption"
              id="vidCaption"
              placeholder="Caption..."
              className="w-[80%] border-[1px] border-black rounded-md pl-2"
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                setCaption(e.target.value);
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

export default VideoModal;
