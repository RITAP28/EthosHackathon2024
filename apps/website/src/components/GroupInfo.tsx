import axios from "axios";
import { Group, User } from "../lib/interface";
import { FaUser } from "react-icons/fa";
import { useAppSelector } from "../redux/hooks/hook";
import { useCallback, useEffect, useState } from "react";

const GroupInfo = ({ group }: { group: Group }) => {
  const { currentUser, accessToken } = useAppSelector((state) => state.user);

  const [owner, setOwner] = useState(null);

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
      <div className="w-full">
        <p className="">{`Created by ${group.ownerId}, ${group.createdAt}`}</p>
      </div>
    </div>
  );
};

export default GroupInfo;
