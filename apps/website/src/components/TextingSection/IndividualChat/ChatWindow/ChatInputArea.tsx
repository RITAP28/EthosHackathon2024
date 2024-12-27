import { GoPaperclip } from "react-icons/go";
import { IoSend } from "react-icons/io5";
import { MdKeyboardVoice } from "react-icons/md";
import {
  ChatHistory,
  CurrentChat,
  latestTextWithUser,
} from "../../../../utils/interface";
import { useState } from "react";
import FileModal from "../../../ui/modals/FileModal";

const ChatInputArea = ({
  ws,
  setTextMessage,
  handleSendButtonClick,
  currentChat,
  setLatestText,
  setChatHistory,
}: {
  ws: WebSocket | null;
  setTextMessage: React.Dispatch<React.SetStateAction<string>>;
  handleSendButtonClick: (
    receiverId: number,
    receiverName: string,
    receiverEmail: string
  ) => Promise<void>;
  currentChat: CurrentChat;
  setLatestText: React.Dispatch<React.SetStateAction<latestTextWithUser>>;
  setChatHistory: React.Dispatch<React.SetStateAction<ChatHistory[]>>;
}) => {
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  const openModal = () => {
    setIsModalOpen(true);
    document.body.style.overflow = "hidden"; // Disable scrolling
  };

  const closeModal = () => {
    setIsModalOpen(false);
    document.body.style.overflow = "auto"; // Enable scrolling
  };

  return (
    <>
      <div
        className="w-[5%] flex justify-center items-center hover:cursor-pointer"
        onClick={openModal}
      >
        <GoPaperclip className="text-[1.5rem] hover:bg-slate-600 transition duration-200 ease-in-out rounded-full" />
      </div>
      <div className="w-[80%] flex justify-start items-center">
        <div className="w-[90%]">
          <input
            type="text"
            name=""
            id=""
            className="w-full px-3 py-2 h-[2rem] bg-slate-200 font-Poppins rounded-lg"
            placeholder="Your Message"
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              e.preventDefault();
              setTextMessage(e.target.value);
            }}
          />
        </div>
      </div>
      <div className="w-[15%] flex flex-row">
        <div className="basis-1/2 flex justify-center items-center">
          <div className="p-3 bg-slate-600 rounded-full hover:cursor-pointer hover:bg-red-400">
            <MdKeyboardVoice className="text-[1.5rem]" />
          </div>
        </div>
        <div className="basis-1/2 flex justify-center items-center">
          <div
            className="p-3 bg-slate-600 hover:cursor-pointer hover:bg-green-500 rounded-full"
            onClick={() => {
              handleSendButtonClick(
                currentChat?.receiverId as number,
                currentChat?.receiverName as string,
                currentChat?.receiverEmail as string
              );
            }}
          >
            <IoSend className="text-[1.5rem]" />
          </div>
        </div>
      </div>
      {isModalOpen && (
        <FileModal
          ws={ws}
          isModalOpen={isModalOpen}
          closeModal={closeModal}
          currentChat={currentChat}
          setLatestText={setLatestText}
          setChatHistory={setChatHistory}
          handleSendButtonClick={handleSendButtonClick}
        />
      )}
    </>
  );
};

export default ChatInputArea;
