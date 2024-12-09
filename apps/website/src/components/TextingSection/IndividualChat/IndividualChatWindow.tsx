import { FaUser } from "react-icons/fa";
import {
  ChatHistory,
  CurrentChat,
} from "../../../lib/interface";
import { useAppSelector } from "../../../redux/hooks/hook";
import { FcVideoCall } from "react-icons/fc";
import { CiMenuKebab } from "react-icons/ci";
import { GoPaperclip } from "react-icons/go";
import { MdKeyboardVoice } from "react-icons/md";
import { IoSend } from "react-icons/io5";

const IndividualChatWindow = ({
  currentChatName,
  loadingChatHistory,
  chatHistory,
  handleDateFormat,
  setTextMessage,
  handleSendButtonClick,
  currentChat,
}: {
  currentChatName: string;
  loadingChatHistory: boolean;
  chatHistory: ChatHistory[];
  handleDateFormat: (sentAt: Date) => string;
  setTextMessage: React.Dispatch<React.SetStateAction<string>>;
  handleSendButtonClick: (
    receiverId: number,
    receiverName: string,
    receiverEmail: string
  ) => Promise<void>;
  currentChat: CurrentChat;
}) => {
  const { currentUser } = useAppSelector((state) => state.user);
  return (
    <div className="w-[75%] h-[100%] bg-slate-400 rounded-r-2xl flex flex-col justify-between">
      {/* upper bar containing the name of the receiver */}
      <div className="w-full h-[10%] flex flex-row bg-slate-500 rounded-tr-2xl">
        <div className="w-[10%] flex justify-center items-center">
          <div className="p-3 bg-slate-400 rounded-xl">
            <FaUser className="text-[2rem]" />
          </div>
        </div>
        <div className="w-[60%] flex justify-start items-center">
          <p className="text-xl font-Philosopher font-semibold">
            {currentChatName}
          </p>
        </div>
        <div className="w-[30%] flex flex-row justify-end items-center gap-4 pr-4">
          <div className="p-2 hover:cursor-pointer hover:bg-slate-400 transition ease-in-out duration-200 rounded-full">
            <FcVideoCall className="text-[2rem]" />
          </div>
          <div className="p-2 hover:cursor-pointer hover:bg-slate-400 transition ease-in-out duration-200 rounded-full">
            <CiMenuKebab className="text-[1.8rem]" />
          </div>
        </div>
      </div>
      {/* space for texts to appear */}
      <div
        className="w-full h-[80%] flex-col-reverse overflow-y-auto p-4 bg-slate-400"
        id="message-container"
      >
        {loadingChatHistory
          ? "Loading your chats, please wait..."
          : chatHistory.map((chat, index) =>
              chat.senderEmail === currentUser?.email ? (
                <div className="flex justify-end pt-2" key={index}>
                  <div className="p-3 bg-green-500 rounded-lg max-w-[70%] flex flex-col">
                    <div className="w-full">
                      <p className="text-white">{chat.textMetadata}</p>
                    </div>
                    <div className="w-full flex justify-end text-[0.7rem]">
                      {handleDateFormat(chat.sentAt)}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex justify-start pt-2" key={index}>
                  <div className="p-3 bg-blue-500 rounded-lg max-w-[70%] flex flex-col">
                    <div className="w-full">
                      <p className="text-white">{chat.textMetadata}</p>
                    </div>
                    <div className="w-full flex justify-end text-[0.7rem]">
                      {handleDateFormat(chat.sentAt)}
                    </div>
                  </div>
                </div>
              )
            )}
      </div>
      {/* lower bar containing the text input for sending the texts */}
      <div className="w-full bg-slate-500 flex flex-row h-[3.5rem]">
        <div className="w-[5%] flex justify-center items-center">
          <GoPaperclip className="text-[1.5rem]" />
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
      </div>
    </div>
  );
};

export default IndividualChatWindow;
