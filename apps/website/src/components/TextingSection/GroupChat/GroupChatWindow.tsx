import { Group, GroupChatHistory } from "../../../utils/interface";
import { useAppSelector } from "../../../redux/hooks/hook";
import GroupInfo from "./GroupWindow/GroupInfo";
import GroupChatInputArea from "./GroupWindow/GroupChatInputArea";
import GroupChatScrollView from "./GroupWindow/GroupChatScrollView";
import GroupHeader from "./GroupWindow/GroupHeader";

const GroupChatWindow = ({
  loadingChatHistory,
  groupChatHistory,
  handleDateFormat,
  resizeWidth,
  setResizeWidth,
  setShowGroupInfo,
  groupChat,
  setGroupTextMessage,
  handleGroupSendButtonClick,
  groupTextMessage,
  showGroupInfo,
  setGroupWindow,
  setGroupChat,
  handleGetGroups,
}: {
  loadingChatHistory: boolean;
  groupChatHistory: GroupChatHistory[];
  handleDateFormat: (sentAt: Date) => string;
  resizeWidth: number;
  setResizeWidth: React.Dispatch<React.SetStateAction<number>>;
  setShowGroupInfo: React.Dispatch<React.SetStateAction<boolean>>;
  groupChat: Group;
  setGroupTextMessage: React.Dispatch<React.SetStateAction<string>>;
  handleGroupSendButtonClick: (
    group: Group,
    textMetadata: string
  ) => Promise<void>;
  groupTextMessage: string;
  showGroupInfo: boolean;
  setGroupWindow: React.Dispatch<React.SetStateAction<boolean | null>>;
  setGroupChat: React.Dispatch<React.SetStateAction<Group | null>>;
  handleGetGroups: () => Promise<void>;
}) => {
  const { accessToken } = useAppSelector((state) => state.user);
  return (
    <>
      <div
        className={`w-[${resizeWidth}%] h-[100%] bg-slate-400 rounded-r-2xl flex flex-col justify-between`}
      >
        <GroupHeader
          resizeWidth={resizeWidth}
          setResizeWidth={setResizeWidth}
          setShowGroupInfo={setShowGroupInfo}
          groupChat={groupChat}
        />
        {/* space for texts to appear */}
        <div
          className="w-full h-[80%] flex-col-reverse overflow-y-auto p-4 bg-slate-400"
          id="message-container"
        >
          {/* group chat window */}
          <GroupChatScrollView
            loadingChatHistory={loadingChatHistory}
            groupChatHistory={groupChatHistory}
            handleDateFormat={handleDateFormat}
          />
        </div>
        {/* lower bar containing the text input for sending the texts */}
        <div className="w-full bg-slate-500 flex flex-row h-[3.5rem] rounded-br-2xl">
          <GroupChatInputArea
            setGroupTextMessage={setGroupTextMessage}
            handleGroupSendButtonClick={handleGroupSendButtonClick}
            groupChat={groupChat}
            groupTextMessage={groupTextMessage}
          />
        </div>
      </div>
      {resizeWidth === 50 && showGroupInfo && (
        <div className=" ml-1 w-[25%] bg-slate-700 rounded-2xl py-2 px-2">
          <GroupInfo
            accessToken={accessToken}
            group={groupChat}
            setGroupWindow={setGroupWindow}
            setGroupChat={setGroupChat}
            setShowGroupInfo={setShowGroupInfo}
            setResizeWidth={setResizeWidth}
            handleGetGroups={handleGetGroups}
          />
        </div>
      )}
    </>
  );
};

export default GroupChatWindow;
