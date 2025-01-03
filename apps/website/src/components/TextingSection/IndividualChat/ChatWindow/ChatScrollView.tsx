import { ChatHistory, MessageType } from "../../../../utils/interface";
import { useAppSelector } from "../../../../redux/hooks/hook";
import axios from "axios";
import { baseUrl, createConfig } from "../../../../utils/util";
import { useEffect, useState } from "react";

const ChatScrollView = ({
  loadingChatHistory,
  chatHistory,
  handleDateFormat,
}: {
  loadingChatHistory: boolean;
  chatHistory: ChatHistory[];
  handleDateFormat: (sentAt: Date) => string;
}) => {
  const { currentUser, accessToken } = useAppSelector((state) => state.user);
  const config = createConfig(accessToken);
  const [processedChatHistory, setProcessedChatHistory] = useState<
    ChatHistory[]
  >([]);

  const handleCheckMediaUrl = async (mediaUrl: string) => {
    try {
      const mediaCheckResponse = await axios.put(
        `${baseUrl}/api/v1/media/update/expires?mediaUrl=${mediaUrl}`,
        config
      );
      console.log("media check response: ", mediaCheckResponse.data);
      return mediaCheckResponse.data.signedUrl || mediaUrl;
    } catch (error) {
      console.error("Error while loading media url: ", error);
      return null;
    }
  };

  useEffect(() => {
    const processChatHistory = async () => {
      const updatedChatHistory = await Promise.all(
        chatHistory.map(async (chat) => {
          if (
            chat.messageType === MessageType.TEXT_MEDIA &&
            chat.mediaUrl !== null
          ) {
            const updatedMediaUrl = await handleCheckMediaUrl(chat.mediaUrl);
            return {
              ...chat,
              mediaUrl: updatedMediaUrl || chat.mediaUrl,
            };
          }
          return chat;
        })
      );
      setProcessedChatHistory(updatedChatHistory);
    };

    processChatHistory();
  }, [chatHistory]);

  return loadingChatHistory
    ? "Loading your chats, please wait..."
    : processedChatHistory.map((chat, index) =>
        chat.senderEmail === currentUser?.email ? (
          // for the sender
          <div className="flex justify-end pt-2" key={index}>
            {chat.mediaUrl !== null ? (
              <div className="flex flex-col gap-2">
                <div className="w-full flex justify-end">
                  <div className="p-3 bg-green-500 rounded-lg max-w-[70%] flex flex-col">
                    <div className="w-full">
                      <img
                        className="w-full h-full object-cover rounded-lg"
                        src={chat.mediaUrl}
                        alt="media"
                      />
                    </div>
                    <div className="w-full flex justify-end text-[0.7rem]">
                      {handleDateFormat(chat.sentAt)}
                    </div>
                  </div>
                </div>
                <div className="w-full flex justify-end">
                  <div className="p-3 bg-green-500 rounded-lg max-w-[70%] flex flex-col">
                    <div className="w-full">
                      <p className="text-white">{chat.textMetadata}</p>
                    </div>
                    <div className="w-full flex justify-end text-[0.7rem]">
                      {handleDateFormat(chat.sentAt)}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-3 bg-green-500 rounded-lg max-w-[70%] flex flex-col">
                <div className="w-full">
                  <p className="text-white">{chat.textMetadata}</p>
                </div>
                <div className="w-full flex justify-end text-[0.7rem]">
                  {handleDateFormat(chat.sentAt)}
                </div>
              </div>
            )}
          </div>
        ) : (
          // for the receiver
          <div className="flex justify-start pt-2" key={index}>
            {chat.mediaUrl !== null ? (
              <div className="flex flex-col gap-2">
                <div className="w-full flex justify-start">
                  <div className="p-3 bg-blue-500 rounded-lg max-w-[70%] flex flex-col">
                    <div className="w-full">
                      <img
                        className="w-full h-full object-cover rounded-lg"
                        src={chat.mediaUrl}
                        alt="media"
                      />
                    </div>
                    <div className="w-full flex justify-end text-[0.7rem]">
                      {handleDateFormat(chat.sentAt)}
                    </div>
                  </div>
                </div>
                <div className="w-full flex justify-start">
                  <div className="p-3 bg-blue-500 rounded-lg max-w-[70%] flex flex-col">
                    <div className="w-full">
                      <p className="text-white">{chat.textMetadata}</p>
                    </div>
                    <div className="w-full flex justify-end text-[0.7rem]">
                      {handleDateFormat(chat.sentAt)}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-3 bg-blue-500 rounded-lg max-w-[70%] flex flex-col">
                <div className="w-full">
                  <p className="text-white">{chat.textMetadata}</p>
                </div>
                <div className="w-full flex justify-end text-[0.7rem]">
                  {handleDateFormat(chat.sentAt)}
                </div>
              </div>
            )}
          </div>
        )
      );
};

export default ChatScrollView;
