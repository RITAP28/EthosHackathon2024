import { FaUser } from "react-icons/fa";
import { ChatPartner, latestTextWithUser } from "../../../utils/interface";
import { useEffect, useState } from "react";

interface ChatSidePanelProps {
  loadingPartners: boolean;
  chatPartners: ChatPartner[];
  setGroupWindow: React.Dispatch<React.SetStateAction<boolean | null>>;
  handleChatButtonClick: (
    receiverId: number,
    receiverName: string,
    receiverEmail: string
  ) => Promise<void>;
  latestText: latestTextWithUser;
  handleDateFormat: (sentAt: Date) => string;
}

const ChatSidePanel = ({
  loadingPartners,
  chatPartners,
  setGroupWindow,
  handleChatButtonClick,
  latestText,
  handleDateFormat,
}: ChatSidePanelProps) => {
  const [localChatPartners, setLocalChatPartners] =
    useState<ChatPartner[]>(chatPartners);

  useEffect(() => {
    setLocalChatPartners(chatPartners);
  }, [chatPartners]);

  // useEffect(() => {
  //   if (latestText.latestText) {
  //     setLocalChatPartners((prev) =>
  //       prev.map((partner) => {
  //         if (
  //           partner.chatPartnerEmail === latestText.sentBy ||
  //           partner.senderEmail === latestText.sentBy
  //         ) {
  //           return {
  //             ...partner,
  //             latestChat: latestText.latestText,
  //             updatedAt: new Date(Date.now()),
  //           };
  //         }
  //         return partner;
  //       })
  //     );
  //   }
  // }, [latestText]);

  return loadingPartners
    ? "Loading your partners..."
    : chatPartners.length > 0
    ? chatPartners.map((partner, index) => {
        // setLastChat(partner.latestChat);
        console.log("partner latest text: ", partner.latestChat);
        return (
          <div
            className="w-[90%] bg-slate-400 flex flex-row py-2 rounded-xl hover:bg-slate-500 hover:cursor-pointer transition ease-in-out duration-200"
            key={index}
            onClick={() => {
              setGroupWindow(false);
              handleChatButtonClick(
                partner.chatPartnerId,
                partner.chatPartnerName,
                partner.chatPartnerEmail
              );
            }}
          >
            <div className="w-[25%] h-full flex justify-center items-center">
              <div className="bg-slate-300 p-3 rounded-xl">
                <FaUser className="text-[2rem]" />
              </div>
            </div>
            <div className="w-[75%] flex flex-col">
              <div className="w-full h-[40%] flex flex-row justify-between pr-3">
                <div>{partner.chatPartnerName}</div>
                <div className="text-[0.7rem]">
                  {latestText.sentAt === partner.updatedAt
                    ? handleDateFormat(latestText.sentAt)
                    : partner.updatedAt && handleDateFormat(partner.updatedAt)}
                </div>
              </div>
              <div className="w-full h-[60%] whitespace-nowrap overflow-hidden text-ellipsis pr-2">
                {/* let's say, Ram is sending a text to Sam */}
                {/* for the sender Ram, latestText.sentBy i.e. Ram !== partner.chatPartnerEmail i.e. Sam */}
                {/* for the receiver Sam, latestText.sentBy i.e. Ram === partner.chatPartnerEmail i.e. Ram */}
                {latestText.sentBy === partner.chatPartnerEmail
                  ? latestText.latestText
                  : partner.latestChat}
              </div>
            </div>
          </div>
        );
      })
    : "Users you chat with will appear here.";
};

export default ChatSidePanel;
