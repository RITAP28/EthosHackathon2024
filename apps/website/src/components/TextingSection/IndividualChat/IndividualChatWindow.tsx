import { ChatHistory, CurrentChat } from "../../../utils/interface";
import ChatScrollView from "./ChatWindow/ChatScrollView";
import ChatInputArea from "./ChatWindow/ChatInputArea";
import ChatHeader from "./ChatWindow/ChatHeader";

const IndividualChatWindow = ({
  currentChatName,
  loadingChatHistory,
  chatHistory,
  handleDateFormat,
  textMessage,
  setTextMessage,
  handleSendButtonClick,
  currentChat,
}: {
  currentChatName: string;
  loadingChatHistory: boolean;
  chatHistory: ChatHistory[];
  handleDateFormat: (sentAt: Date) => string;
  textMessage: string;
  setTextMessage: React.Dispatch<React.SetStateAction<string>>;
  handleSendButtonClick: (
    receiverId: number,
    receiverName: string,
    receiverEmail: string,
    mediaUrl: string | null,
    textMetadata: string
  ) => Promise<void>;
  currentChat: CurrentChat;
}) => {
  return (
    <div className="w-[75%] h-[100%] bg-slate-400 rounded-r-2xl flex flex-col justify-between">
      {/* upper bar containing the name of the receiver */}
      <ChatHeader currentChatName={currentChatName} />
      {/* space for texts to appear */}
      <div
        className="w-full h-[80%] flex-col-reverse overflow-y-auto p-4 bg-slate-400"
        id="message-container"
      >
        <ChatScrollView
          loadingChatHistory={loadingChatHistory}
          chatHistory={chatHistory}
          handleDateFormat={handleDateFormat}
        />
      </div>
      {/* lower bar containing the text input for sending the texts */}
      <div className="w-full bg-slate-500 flex flex-row h-[3.5rem]">
        <ChatInputArea
          textMessage={textMessage}
          setTextMessage={setTextMessage}
          handleSendButtonClick={handleSendButtonClick}
          currentChat={currentChat}
        />
      </div>
    </div>
  );
};

export default IndividualChatWindow;
