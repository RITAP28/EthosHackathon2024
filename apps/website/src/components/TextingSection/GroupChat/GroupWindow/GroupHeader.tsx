import { CiMenuKebab } from "react-icons/ci";
import { FaUser } from "react-icons/fa";
import { FcVideoCall } from "react-icons/fc";
import { Group } from "../../../../utils/interface";

const GroupHeader = ({
    resizeWidth,
    setResizeWidth,
    setShowGroupInfo,
    groupChat
} : {
    resizeWidth: number;
    setResizeWidth: React.Dispatch<React.SetStateAction<number>>;
    setShowGroupInfo: React.Dispatch<React.SetStateAction<boolean>>;
    groupChat: Group
}) => {
  return (
    <>
      <div className="w-full h-[10%] flex flex-row bg-slate-500 rounded-tr-2xl">
        <div className="w-[10%] flex justify-center items-center">
          <div className="p-3 bg-slate-400 rounded-xl">
            <FaUser className="text-[2rem]" />
          </div>
        </div>
        <div className="w-[60%] flex justify-start items-center">
          <p
            className="text-xl font-Philosopher font-semibold hover:cursor-pointer"
            onClick={() => {
              if (resizeWidth === 75) {
                setResizeWidth(50);
                setShowGroupInfo(true);
              } else {
                setResizeWidth(75);
                setShowGroupInfo(false);
              }
            }}
          >
            {groupChat.name}
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
    </>
  );
};

export default GroupHeader;
