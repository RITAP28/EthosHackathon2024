import axios from "axios";
import { Group, Members } from "../lib/interface";
import { FaUser } from "react-icons/fa";
import { useAppSelector } from "../redux/hooks/hook";
import React, { SetStateAction, useCallback, useEffect, useState } from "react";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  useDisclosure,
  Button,
} from "@chakra-ui/react";

interface IGroupOwner {
  name: string;
  email: string;
  ownedGroups: Group[];
  isAuthenticated: boolean;
}
const GroupInfo = ({
  accessToken,
  group,
  setGroupWindow,
  setGroupChat,
  setShowGroupInfo,
  setResizeWidth,
  handleGetGroups
}: {
  accessToken: string | null;
  group: Group;
  setGroupWindow: React.Dispatch<SetStateAction<boolean | null>>;
  setGroupChat: React.Dispatch<SetStateAction<Group | null>>;
  setShowGroupInfo: React.Dispatch<React.SetStateAction<boolean>>;
  setResizeWidth: React.Dispatch<React.SetStateAction<number>>;
  handleGetGroups: () => Promise<void>;
}) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  //   const toast = useToast();
  const { currentUser } = useAppSelector((state) => state.user);

  const [exitGroupModal, setExitGroupModal] = useState<boolean>(false);
  const [makeSomeoneAdminBeforeExiting, setMakeSomeoneAdminBeforeExiting] =
    useState<boolean>(false);

  const [owner, setOwner] = useState<IGroupOwner | null>(null);

  const [groupMembersLoading, setGroupMembersLoading] =
    useState<boolean>(false);
  const [groupMembers, setGroupMembers] = useState<Members[]>([]);
  const [selectedAdmin, setSelectedAdmin] = useState<Members | null>(null);

  const adminArray: Members[] = [];
  group.members.forEach((member) => {
    if (member.role === "ADMIN") {
      adminArray.push(member);
    }
  });
  console.log(`Admins in the group ${group.name}: `, adminArray);

  const handleMakeAdmin = async (userId: number, groupId: number) => {
    try {
      const makeAdmin = await axios.put(
        `${
          import.meta.env.VITE_BASE_URL
        }/put/group/makeAdminBeforeExiting?groupId=${groupId}&newAdminId=${userId}&oldAdminId=${
          currentUser?.id
        }`,
        {
          withCredentials: true,
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );
      console.log(
        `Admin has been changed and the new admin of the group ${group.name} is: `,
        makeAdmin.data.newAdmin
      );
      console.log("Make Admin Response: ", makeAdmin.data);
    } catch (error) {
      console.error(
        "Error while getting confirmation for exiting the group: ",
        error
      );
    }
  };

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

  const handleGetMembers = useCallback(
    async (group: Group) => {
      setGroupMembersLoading(true);
      try {
        const groupMembersResponse = await axios.get(
          `${import.meta.env.VITE_BASE_URL}/get/group/members?groupId=${
            group.id
          }`,
          {
            withCredentials: true,
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json",
            },
          }
        );
        console.log(
          `Here are the group members for the group ${group.name}: `,
          groupMembersResponse.data.groupMembers
        );
        setGroupMembers(groupMembersResponse.data.groupMembers);
      } catch (error) {
        console.error("Error while getting members of the group: ", error);
      }
      setGroupMembersLoading(false);
    },
    [accessToken]
  );

  useEffect(() => {
    if (makeSomeoneAdminBeforeExiting === true) {
      handleGetMembers(group);
    }
  }, [handleGetMembers, group, makeSomeoneAdminBeforeExiting]);

  const handleExitGroup = async (userId: number, groupId: number) => {
    try {
      console.log("selectedAdmin: ", selectedAdmin);
      await handleMakeAdmin(selectedAdmin?.userId as number, group.id);
      const exitGroupAction = await axios.delete(
        `${
          import.meta.env.VITE_BASE_URL
        }/delete/group/exit/admin?userId=${userId}&groupId=${groupId}&newAdminId=${
          selectedAdmin?.userId
        }`,
        {
          withCredentials: true,
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );
      console.log(
        `The new admin of the group ${group.id} is: `,
        selectedAdmin?.name
      );
      console.log(
        `Updated Members of ${group.name}: `,
        exitGroupAction.data.updatedMembers
      );
      setGroupChat(null);
      setGroupWindow(null);
      setShowGroupInfo(false);
      setResizeWidth(75);
      await handleGetGroups();
      onClose();
      // await handleRefreshGroups();
    } catch (error) {
      console.error("Error  while exiting groups: ", error);
    }
  };

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
            <div
              className="w-full flex flex-row py-2 px-2 bg-slate-500 rounded-lg"
              key={index}
            >
              {member.role === "ADMIN" ? (
                <>
                  <div className="w-[80%] items-center text-black font-bold">
                    {member.name}
                  </div>
                  <div className="w-[20%]">
                    <button className="rounded-sm hover:cursor-default px-[4px] py-[1px] font-bold text-black">
                      {member.role}
                    </button>
                  </div>
                </>
              ) : (
                <div className="w-full flex flex-row text-black font-bold">
                  {member.name}
                </div>
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
              {/* <ModalCloseButton /> */}
              <ModalBody>
                <div className="w-full font-Philosopher font-bold">
                  Are you sure you want to exit group {`${group.name}`}?
                </div>
                <div className="w-full">This action cannot be undone.</div>
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
                <button
                  type="button"
                  className="bg-red-400 px-3 py-2 rounded-md font-bold hover:cursor-pointer"
                  onClick={async () => {
                    console.log("Clicked yes");
                    if (adminArray.length === 1) {
                      // another modal to make someone else the admin
                      console.log(
                        "Since there is only one admin, you need to make someone admin first before exiting the group"
                      );
                      setMakeSomeoneAdminBeforeExiting(true);
                    } else {
                      // direct exit
                      await handleExitGroup(
                        currentUser?.id as number,
                        group.id
                      );
                    }
                  }}
                >
                  Yes
                </button>
              </ModalFooter>
            </ModalContent>
          </Modal>
        )}

        {/* modal for making someone else admin before completely exiting the group */}
        {makeSomeoneAdminBeforeExiting && (
          <Modal isOpen={isOpen} onClose={onClose} isCentered>
            <ModalOverlay />
            <ModalContent>
              <ModalHeader>
                <div className="w-full flex justify-center font-Philosopher font-bold text-[1.5rem]">
                  Make somebody Admin first:
                </div>
              </ModalHeader>
              <ModalBody>
                <div className="">
                  {groupMembersLoading ? (
                    "Loading..."
                  ) : (
                    <div className="w-full flex flex-row">
                      <div className="w-[50%]">Choose Admin:</div>
                      <div className="w-[50%]">
                        <select
                          name="members"
                          id=""
                          className=""
                          onChange={(e) => {
                            setSelectedAdmin(
                              groupMembers[e.target.selectedIndex]
                            );
                          }}
                        >
                          {groupMembers.map((member, index) => (
                            <option value={member.name} key={index}>
                              {member.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}
                </div>
              </ModalBody>

              <ModalFooter>
                <Button
                  colorScheme="blue"
                  mr={3}
                  onClick={() => {
                    setMakeSomeoneAdminBeforeExiting(false);
                    setExitGroupModal(false);
                    onClose();
                  }}
                >
                  Close
                </Button>
                <button
                  type="button"
                  className="bg-red-400 px-3 py-2 rounded-md font-bold hover:cursor-pointer"
                  onClick={() => {
                    handleExitGroup(currentUser?.id as number, group.id);
                  }}
                >
                  Confirm and Exit
                </button>
              </ModalFooter>
            </ModalContent>
          </Modal>
        )}
      </div>
    </div>
  );
};

export default GroupInfo;
