import axios from "axios";
import { Group } from "../lib/interface";
import { FaUser } from "react-icons/fa";
import { useAppSelector } from "../redux/hooks/hook";
import { useCallback, useEffect, useState } from "react";

interface IGroupOwner {
  name: string;
  email: string;
  ownedGroups: Group[];
  isAuthenticated: boolean;
}

const GroupInfo = ({ group }: { group: Group }) => {
  const { currentUser, accessToken } = useAppSelector((state) => state.user);

  const [owner, setOwner] = useState<IGroupOwner | null>(null);

  const handleGetOwner = useCallback(async () => {
    try {
      const groupOwnerResponse = await axios.get(
        `${import.meta.env.VITE_BASE_URL}/get/group/owner?id=${group.ownerId}`,
        {
          withCredentials: true,
          headers: {
            Authorization: `Bearer $${accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );
      console.log("Here is the group owner: ", groupOwnerResponse);
      setOwner(groupOwnerResponse.data.groupOwner);
    } catch (error) {
      console.error("Error fetching group owner: ", error);
    }
  }, [group.ownerId, accessToken]);

  useEffect(() => {
    handleGetOwner();
  }, [handleGetOwner]);

  return (
    <div className="w-full flex flex-col">
      <div className="w-full flex justify-center bg-red-200">
        <div className="border-[1px] border-black rounded-full overflow-hidden">
          <FaUser className="w-32 h-32" />
        </div>
      </div>
      <div className="w-full font-Philosopher font-bold flex justify-center text-[2rem] bg-slate-400">
        {group.name}
      </div>
      <div className="w-full font-Philosopher font-bold flex justify-center text-2 bg-slate-200">
        Group · {group.members.length} members
      </div>
      <div className="w-full py-2 flex justify-center font-Philosopher text-8 font-bold">
        <p className="">{`Created by ${owner?.name}`}</p>
      </div>
      <div className="w-full bg-slate-200">Files shared:</div>
      <div className="w-full bg-slate-300 flex flex-col">
        <div className="w-full flex justify-center font-Philosopher">
          Members:
        </div>
        <div className="w-full flex flex-col font-Philosopher">
          {group.members.map((member, index) => (
            <div className="w-full flex flex-row py-2 px-2" key={index}>
              {member.role === "ADMIN" ? (
                <>
                  <div className="w-[80%] items-center">{member.name}</div>
                  <div className="w-[20%]">
                    <button className="border-[1px] border-black rounded-lg hover:cursor-default px-[2px] py-[1px] font-bold bg-black text-red-400">
                        {member.role}
                    </button>
                  </div>
                </>
              ) : (
                <div className="w-full">{member.name}</div>
              )}
            </div>
          ))}
        </div>
      </div>
      <div className="w-full flex flex-row py-3 px-2 gap-2">
        <div className="w-[50%] flex justify-center">
            <button type="button" className="w-full hover:cursor-pointer border-[1px] border-black rounded-lg py-2 font-bold transition ease-in-out duration-200 hover:bg-black hover:text-red-400">
                Exit Group
            </button>
        </div>
        <div className="w-[50%] flex justify-center">
            <button type="button" className="w-full hover:cursor-pointer border-[1px] border-black rounded-lg py-2 font-bold transition ease-in-out duration-200 hover:bg-black hover:text-red-400">
                Report Group
            </button>
        </div>
      </div>
    </div>
  );
};

export default GroupInfo;
