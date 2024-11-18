import axios from "axios";
import { Group } from "../lib/interface";
import { FaUser } from "react-icons/fa";
import { useAppSelector } from "../redux/hooks/hook";
import { useCallback, useEffect, useState } from "react";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  useToast,
  Button,
} from "@chakra-ui/react";

interface IGroupOwner {
  name: string;
  email: string;
  ownedGroups: Group[];
  isAuthenticated: boolean;
}
const GroupInfo = ({ group }: { group: Group }) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();
  const { currentUser, accessToken } = useAppSelector((state) => state.user);

  const [exitGroupModal, setExitGroupModal] = useState<boolean | null>(null);

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
      <div className="w-full flex justify-center">
        <div className="border-[1px] border-black rounded-full overflow-hidden">
          <FaUser className="w-32 h-32 text-slate-400" />
        </div>
      </div>
      <div className="w-full font-Philosopher font-bold flex justify-center text-[2rem] text-white">
        {group.name}
      </div>
      <div className="w-full font-Philosopher font-bold flex justify-center text-2 text-slate-300">
        Group · {group.members.length} members
      </div>
      <div className="w-full py-2 flex justify-center font-Philosopher text-8 font-bold text-slate-300">
        <p className="">{`Created by ${owner?.name}`}</p>
      </div>
      <div className="w-full text-slate-200">Files shared:</div>
      <div className="w-full text-slate-300 flex flex-col">
        <div className="w-full flex justify-center font-Philosopher">
          Members:
        </div>
        <div className="w-full flex flex-col gap-2 font-Philosopher">
          {group.members.map((member, index) => (
            <div className="w-full flex flex-row py-2 px-2 bg-slate-500 rounded-lg" key={index}>
              {member.role === "ADMIN" ? (
                <>
                  <div className="w-[80%] items-center text-black font-bold">{member.name}</div>
                  <div className="w-[20%]">
                    <button className="rounded-sm hover:cursor-default px-[4px] py-[1px] font-bold text-black">
                      {member.role}
                    </button>
                  </div>
                </>
              ) : (
                <div className="w-full flex flex-row text-black font-bold">{member.name}</div>
              )}
            </div>
          ))}
        </div>
      </div>
      <div className="w-full flex flex-row py-3 px-2 gap-2">
        <div className="w-[50%] flex justify-center">
          <button
            type="button"
            className="w-full hover:cursor-pointer border-[1px] text-white border-black rounded-lg py-2 font-bold transition ease-in-out duration-200 hover:bg-red-400 hover:text-black"
            onClick={() => {
              setExitGroupModal(true);
              onOpen();
            }}
          >
            Exit Group
          </button>
        </div>
        <div className="w-[50%] flex justify-center">
          <button
            type="button"
            className="w-full hover:cursor-pointer border-[1px] border-black text-white rounded-lg py-2 font-bold transition ease-in-out duration-200 hover:bg-black hover:text-red-400"
          >
            Report Group
          </button>
        </div>
      </div>
      <div className="">
        {exitGroupModal && (
          <Modal isOpen={isOpen} onClose={onClose} isCentered>
            <ModalOverlay />
            <ModalContent>
              <ModalHeader>
                <div className="w-full flex justify-center">
                    Exiting group {`${group.name}`}
                </div>
              </ModalHeader>
              <ModalCloseButton />
              <ModalBody>
                <div className="w-full font-Philosopher font-bold">
                Are you sure you want to exit group {`${group.name}`}? 
                </div>
                <div className="w-full">
                This action cannot be undone.
                </div>
              </ModalBody>

              <ModalFooter>
                <Button
                  colorScheme="blue"
                  mr={3}
                  onClick={() => {
                    setExitGroupModal(false);
                    onClose();
                  }}
                >
                  Cancel
                </Button>
                <Button variant="ghost" className="bg-red-400">
                    Yes
                </Button>
              </ModalFooter>
            </ModalContent>
          </Modal>
        )}
      </div>
    </div>
  );
};

export default GroupInfo;
