import { ChatHistory } from "../../../../utils/interface";
import { useAppSelector } from "../../../../redux/hooks/hook";

const ChatScrollView = ({
  loadingChatHistory,
  chatHistory,
  handleDateFormat
}: {
  loadingChatHistory: boolean;
  chatHistory: ChatHistory[];
  handleDateFormat: (sentAt: Date) => string;
}) => {
  const { currentUser } = useAppSelector((state) => state.user);
  return loadingChatHistory
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
      );
};

export default ChatScrollView;
