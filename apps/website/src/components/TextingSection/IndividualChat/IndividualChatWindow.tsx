import { ChatHistory, CurrentChat, latestTextWithUser } from "../../../utils/interface";
import ChatScrollView from "./ChatWindow/ChatScrollView";
import ChatInputArea from "./ChatWindow/ChatInputArea";
import ChatHeader from "./ChatWindow/ChatHeader";

const IndividualChatWindow = ({
  ws,
  currentChatName,
  loadingChatHistory,
  chatHistory,
  handleDateFormat,
  setTextMessage,
  handleSendButtonClick,
  currentChat,
  setLatestText,
  setChatHistory
}: {
  ws: WebSocket | null,
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
  setLatestText: React.Dispatch<React.SetStateAction<latestTextWithUser>>
  setChatHistory: React.Dispatch<React.SetStateAction<ChatHistory[]>>
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
          ws={ws}
          setTextMessage={setTextMessage}
          handleSendButtonClick={handleSendButtonClick}
          currentChat={currentChat}
          setLatestText={setLatestText}
          setChatHistory={setChatHistory}
        />
      </div>
    </div>
  );
};

export default IndividualChatWindow;
