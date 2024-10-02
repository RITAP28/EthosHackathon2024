import { ShootingStars } from "../../components/ui/ShootingStars";
import { StarsBackground } from "../../components/ui/StarBackground";
import { BsChatSquareFill } from "react-icons/bs";
import { MdOutlineWork } from "react-icons/md";
import { FaUserFriends } from "react-icons/fa";
import { IoMdArchive } from "react-icons/io";
import { FaUser } from "react-icons/fa";
import { IoMdSettings } from "react-icons/io";
import { useAppSelector } from "../../redux/hooks/hook";
import TextingSection from "../../components/TextingSection";
import { SlLogout } from "react-icons/sl";

const ClientDashboard = () => {
  const { currentUser } = useAppSelector((state) => state.user);
  return (
    <div className="min-h-screen bg-neutral-900 flex flex-row relative w-full">
      <div className="w-[6%] min-h-screen flex flex-col items-center justify-center bg-transparent z-20 px-1 font-Philosopher">
        <div className="w-full hover:bg-slate-700 py-4 rounded-md hover:cursor-pointer transition duration-200 ease-in-out hover:text-slate-400 text-slate-400">
          <div className="w-full flex justify-center">
            <BsChatSquareFill className="w-7 h-7" />
          </div>
          <div className="w-full flex justify-center">
            <p className="text-sm text-slate-400">All Chats</p>
          </div>
        </div>
        <div className="w-full hover:bg-slate-700 py-4 rounded-md hover:cursor-pointer transition duration-200 ease-in-out hover:text-slate-400 text-slate-400">
          <div className="w-full flex justify-center">
            <MdOutlineWork className="w-7 h-7" />
          </div>
          <div className="w-full flex justify-center">
            <p className="text-sm text-slate-400">Work</p>
          </div>
        </div>
        <div className="w-full hover:bg-slate-700 py-4 rounded-md hover:cursor-pointer transition duration-200 ease-in-out hover:text-slate-400 text-slate-400">
          <div className="w-full flex justify-center">
            <FaUserFriends className="w-7 h-7" />
          </div>
          <div className="w-full flex justify-center">
            <p className="text-sm text-slate-400">Friends</p>
          </div>
        </div>
        <div className="w-full hover:bg-slate-700 py-4 rounded-md hover:cursor-pointer transition duration-200 ease-in-out hover:text-slate-400 text-slate-400">
          <div className="w-full flex justify-center">
            <IoMdArchive className="w-7 h-7" />
          </div>
          <div className="w-full flex justify-center">
            <p className="text-sm text-slate-400">Archive</p>
          </div>
        </div>
        <div className="w-full flex justify-center py-1">
          <hr className="w-[50%] border-[0.5px] border-slate-700" />
        </div>
        <div className="w-full hover:bg-slate-700 py-4 rounded-md hover:cursor-pointer transition duration-200 ease-in-out hover:text-slate-400 text-slate-400">
          <div className="w-full flex justify-center">
            <FaUser className="w-7 h-7" />
          </div>
          <div className="w-full flex justify-center">
            <p className="text-sm text-slate-400">
              {currentUser && currentUser.name}
            </p>
          </div>
        </div>
        <div className="w-full hover:bg-slate-700 py-4 rounded-md hover:cursor-pointer transition duration-200 ease-in-out hover:text-slate-400 text-slate-400">
          <div className="w-full flex justify-center">
            <IoMdSettings className="w-7 h-7" />
          </div>
          <div className="w-full flex justify-center">
            <p className="text-sm text-slate-400">Settings</p>
          </div>
        </div>
        <div className="w-full hover:bg-slate-700 py-4 rounded-md hover:cursor-pointer transition duration-200 ease-in-out hover:text-slate-400 text-slate-400">
          <div className="w-full flex justify-center pr-2">
            <SlLogout className="w-7 h-7" />
          </div>
          <div className="w-full flex justify-center">
            <p className="text-sm text-slate-400">Log out</p>
          </div>
        </div>
      </div>
      <div className="w-[94%] min-h-screen z-20">
        <TextingSection />
      </div>
      <StarsBackground />
      <ShootingStars minDelay={2000} maxDelay={3000} />
    </div>
  );
};

export default ClientDashboard;
