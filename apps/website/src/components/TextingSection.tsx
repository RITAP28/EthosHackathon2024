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
} from "@chakra-ui/react";
import { ChangeEvent, useCallback, useEffect, useState } from "react";
import {
  ChatHistory,
  ChatPartner,
  CurrentChat,
  Group,
  GroupChatHistory,
  latestTextWithUser,
  User,
} from "../lib/interface";
import axios from "axios";
import { useAppSelector } from "../redux/hooks/hook";
import { FaUser } from "react-icons/fa";
import { CiLock } from "react-icons/ci";
import { FcVideoCall } from "react-icons/fc";
import { CiMenuKebab } from "react-icons/ci";
import { GoPaperclip } from "react-icons/go";
import { MdKeyboardVoice } from "react-icons/md";
import { IoSend } from "react-icons/io5";
import GroupInfo from "./GroupInfo";

const TextingSection = ({
  token,
  latestText,
  setLatestText,
  ws,
  chatHistory,
  setChatHistory,
  displayGroups,
  displayIndividualChats,
  groups,
  loadingGroups,
  handleGetGroups,
  groupChatHistory,
  setGroupChatHistory
}: {
  token: string;
  latestText: latestTextWithUser;
  setLatestText: React.Dispatch<React.SetStateAction<latestTextWithUser>>;
  ws: WebSocket | null;
  chatHistory: ChatHistory[];
  setChatHistory: React.Dispatch<React.SetStateAction<ChatHistory[]>>;
  displayGroups: boolean;
  displayIndividualChats: boolean;
  groups: Group[];
  loadingGroups: boolean;
  handleGetGroups: () => Promise<void>;
  groupChatHistory: GroupChatHistory[];
  setGroupChatHistory: React.Dispatch<React.SetStateAction<GroupChatHistory[]>>
}) => {
  console.log(token);
  const { currentUser, accessToken } = useAppSelector((state) => state.user);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [loading, setLoading] = useState<boolean>(false);
  const [users, setUsers] = useState<User[]>([]);

  const [searchUsersLoading, setSearchUsersLoading] = useState<boolean | null>(
    null
  );
  const [createGroupModal, setCreateGroupModal] = useState<boolean | null>(
    null
  );

  // states for displaying chat/group windows
  const [loadingWindow, setLoadingWindow] = useState<boolean>(false);
  const [chatWindow, setChatWindow] = useState<boolean>(false);
  const [groupWindow, setGroupWindow] = useState<boolean | null>(null);

  // states for texting window
  const [currentChat, setCurrentChat] = useState<CurrentChat | null>(null);
  const [currentChatName, setCurrentChatName] = useState<string | null>(null);

  // states for group window
  const [groupChat, setGroupChat] = useState<Group | null>(null);

  // states for chat partners
  const [chatPartners, setChatPartners] = useState<ChatPartner[]>([]);
  const [, setChatPartnerViaSocket] = useState<ChatPartner[]>([]);
  const [loadingPartners, setLoadingPartners] = useState<boolean>(false);

  const [textMessage, setTextMessage] = useState<string>("");
  const [groupTextMessage, setGroupTextMessage] = useState<string>("");

  const [loadingChatHistory, setLoadingChatHistory] = useState<boolean>(false);
  const toast = useToast();

  // const [loadingGroups, setLoadingGroups] = useState<boolean>(false);
  const [groupCreationLoading, setGroupCreationLoading] =
    useState<boolean>(false);
  const [groupName, setGroupName] = useState<string | null>(null);
  const [groupDescription, setGroupDescription] = useState<string | null>(null);
  const [resizeWidth, setResizeWidth] = useState<number>(75);
  const [showGroupInfo, setShowGroupInfo] = useState<boolean>(false);

  const usersToAddInTheGroup: User[] = [];

  const getUsersFromDB = async () => {
    setLoading(true);
    try {
      const getUsersResponse = await axios.get(
        `http://localhost:8000/getusersfromdb?id=${currentUser?.id}`,
        {
          withCredentials: true,
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );
      console.log(getUsersResponse.data);
      setUsers(getUsersResponse.data.users);
    } catch (error) {
      console.error("Error while getting users from database: ", error);
    }
    setLoading(false);
  };

  const insertingChatPartnerInDB = async (
    senderId: number,
    chatPartnerId: number,
    senderName: string,
    senderEmail: string,
    chatPartnerName: string,
    chatPartnerEmail: string
  ) => {
    try {
      const insertChatPartnerResponse = await axios.post(
        `http://localhost:8000/insertchatpartner`,
        {
          senderId,
          chatPartnerId,
          senderName,
          senderEmail,
          chatPartnerName,
          chatPartnerEmail,
        },
        {
          withCredentials: true,
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );
      console.log("Response: ", insertChatPartnerResponse);
    } catch (error) {
      console.error("Error while inserting chat partner in database: ", error);
    }
  };

  const handleChatButtonClick = async (
    receiverId: number,
    receiverName: string,
    receiverEmail: string
  ) => {
    console.log("receiverName: ", receiverName);
    console.log("receiverEmail: ", receiverEmail);
    setLoadingWindow(true);
    try {
      if (ws && ws.OPEN) {
        ws.send(
          JSON.stringify({
            action: "start-chat",
            targetEmail: receiverEmail,
          })
        );

        ws.onmessage = (message) => {
          const data = JSON.parse(message.data);
          console.log("Received message from the server: ", data);
          if (data.message === `Target user ${receiverEmail} not found`) {
            console.error("Connection to targetUser failed");
            return;
          }
          if (data.message === `${receiverEmail} connected`) {
            console.log(`${receiverEmail} has connected to the chat`);
            getDetailsAboutChatPartner(receiverEmail);
            setChatWindow(true);
            setCurrentChat({
              receiverId: receiverId,
              receiverName: receiverName,
              receiverEmail: receiverEmail,
            });
            fetchingChatPartnersFromDatabase(currentUser?.id as number);
            toast({
              title: `${receiverEmail} has connected to the chat`,
              description: `You can now chat with ${receiverEmail}`,
              status: "success",
              duration: 4000,
              isClosable: true,
            });
            onClose();
          }
          if (
            data.message ===
            `${receiverEmail} is offline, but you can still send messages`
          ) {
            console.log(
              `${receiverEmail} is offline, but you can still send messages`
            );
            getDetailsAboutChatPartner(receiverEmail);
            setChatWindow(true);
            setCurrentChat({
              receiverId: receiverId,
              receiverName: receiverName,
              receiverEmail: receiverEmail,
            });
            fetchingChatPartnersFromDatabase(currentUser?.id as number);
            toast({
              title: `${receiverEmail} is offline, but you can still send messages`,
              status: "info",
              duration: 4000,
              isClosable: true,
              position: "top-right",
            });
            onClose();
          }
        };

        ws.onclose = () => {
          console.log("Websocket connection closed");
          toast({
            title: `WebSocket connection closed`,
            description: `Now you are no longer connected to our servers`,
            status: "warning",
            duration: 4000,
            isClosable: true,
          });
        };

        ws.onerror = () => {
          console.error("Websocket connection error");
          toast({
            title: `WebSocket connection Error`,
            description: `Something went wrong with websockets`,
            status: "error",
            duration: 4000,
            isClosable: true,
          });
        };
      }
    } catch (error) {
      console.error(`Error connecting to ${receiverEmail}`, error);
      toast({
        title: `Error connecting to ${receiverEmail}`,
        description: `Something went wrong with websockets`,
        status: "error",
        duration: 4000,
        isClosable: true,
        position: "top-right",
      });
    }
    setLoadingWindow(false);
  };

  const fetchingChatPartnersFromDatabase = useCallback(
    async (senderId: number) => {
      setLoadingPartners(true);
      try {
        const chatPartners = await axios.get(
          `http://localhost:8000/getchatpartnersfromdb?senderId=${senderId}`,
          {
            withCredentials: true,
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json",
            },
          }
        );
        console.log("Here are your chat partners: ", chatPartners.data);
        setChatPartners(chatPartners.data.chatPartners);
        // setLastChat(chatPartners.data.latestChat);
      } catch (error) {
        console.error(
          "Error while fetching chat partners from database: ",
          error
        );
      }
      setLoadingPartners(false);
    },
    [accessToken]
  );

  useEffect(() => {
    // getting the chat partners from the database
    fetchingChatPartnersFromDatabase(currentUser?.id as number);
  }, [currentUser, fetchingChatPartnersFromDatabase]);

  const getDetailsAboutChatPartner = async (receiverEmail: string) => {
    try {
      const chatPartnerDetailResponse = await axios.get(
        `http://localhost:8000/getchatpartnerdetail`,
        {
          params: {
            receiverEmail,
          },
          withCredentials: true,
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );
      console.log(
        "Details about your chat partner: ",
        chatPartnerDetailResponse.data
      );
      setCurrentChatName(chatPartnerDetailResponse.data.chatPartnerName.name);
    } catch (error) {
      console.error("Error while fetching details about chat partner: ", error);
    }
  };

  const handleGetSpecificChatPartnerById = async (
    receiverId: number,
    senderId: number
  ) => {
    try {
      const existingChatPartner = await axios.get(
        `http://localhost:8000/getchatpartnerbyid?chatPartnerId=${receiverId}&senderId=${senderId}`,
        {
          withCredentials: true,
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );
      setCurrentChatName(existingChatPartner.data.chatPartner.chatPartnerName);
    } catch (error) {
      console.error(
        "Error while fetching specific chat partner by id from db: ",
        error
      );
    }
  };

  const handleSendButtonClick = async (
    receiverId: number,
    receiverName: string,
    receiverEmail: string
  ) => {
    try {
      if (ws && ws.OPEN) {
        ws.send(
          JSON.stringify({
            action: "send-message",
            targetEmail: receiverEmail,
            message: textMessage,
          })
        );
        setLatestText({
          receivedBy: receiverEmail,
          sentBy: currentUser?.email as string,
          latestText: textMessage,
          sentAt: new Date(Date.now()),
        });
        setChatHistory((prevChats) => [
          ...prevChats,
          {
            senderEmail: currentUser?.email as string,
            receiverEmail: receiverEmail,
            textMetadata: textMessage,
            sentAt: new Date(Date.now()),
          },
        ]);

        await handleGetSpecificChatPartnerById(
          receiverId,
          currentUser?.id as number
        );
        if (currentChatName === null) {
          setChatPartners((prevChatPartners) => [
            ...prevChatPartners,
            {
              chatPartnerId: receiverId,
              chatPartnerName: receiverName,
              chatPartnerEmail: receiverEmail,
              latestChat: textMessage,
              startedAt: new Date(Date.now()),
            },
          ]);
        }

        ws.onclose = () => {
          console.log("Websocket connection closed");
          toast({
            title: `WebSocket connection closed`,
            description: `Now you are no longer connected to our servers`,
            status: "error",
            duration: 4000,
            isClosable: true,
          });
        };

        ws.onerror = () => {
          console.error("Websocket connection error");
          toast({
            title: `WebSocket connection Error`,
            description: `Something went wrong with websockets`,
            status: "error",
            duration: 4000,
            isClosable: true,
          });
        };
      }
    } catch (error) {
      console.error("Error while sending message: ", error);
    }
  };

  const handleDateFormat = (sentAt: Date): string => {
    const messageDate = new Date(sentAt);
    const currentDate = new Date();

    const differenceInTime = currentDate.getTime() - messageDate.getTime();
    const differenceInDays = Math.floor(differenceInTime / (1000 * 3600 * 24));

    const isToday = currentDate.toDateString() === messageDate.toDateString();
    const isYesterday =
      new Date(
        currentDate.setDate(currentDate.getDate() - 1)
      ).toDateString() === messageDate.toDateString();

    // Format for "Today" (only show time)
    if (isToday) {
      return new Intl.DateTimeFormat("en-US", {
        hour: "numeric",
        minute: "numeric",
        hour12: true,
      }).format(messageDate);
    }

    // Format for "Yesterday"
    if (isYesterday) {
      return `Yesterday, ${new Intl.DateTimeFormat("en-US", {
        hour: "numeric",
        minute: "numeric",
        hour12: true,
      }).format(messageDate)}`;
    }

    // Format for messages within the past 5 days
    if (differenceInDays <= 5) {
      return new Intl.DateTimeFormat("en-US", {
        weekday: "long", // Day of the week (e.g., Thursday)
        hour: "numeric",
        minute: "numeric",
        hour12: true,
      }).format(messageDate);
    }

    // Format for messages older than 5 days (MM/DD/YYYY, HH:MM AM/PM)
    return new Intl.DateTimeFormat("en-US", {
      dateStyle: "short",
      timeStyle: "short",
    }).format(messageDate);
  };

  const handleGroupSendButtonClick = async (
    group: Group,
    textMetadata: string,
  ) => {
    try {
      if (ws && ws.OPEN) {
        console.log("Message successfully sent to the group");
        ws.send(
          JSON.stringify({
            action: "send-group-message",
            targetGroup: group,
            textMetadata: textMetadata,
            senderId: Number(currentUser?.id)
          })
        );
        setGroupChatHistory((prevChats) => [
          ...prevChats,
          {
            groupId: group.id as number,
            groupName: group.name as string,
            senderId: currentUser?.id as number,
            senderName: currentUser?.name as string,
            senderEmail: currentUser?.email as string,
            textMetadata: textMetadata,
            sentAt: new Date(Date.now()),
            isDelivered: false,
          },
        ]);

        ws.onclose = () => {
          console.log("Websocket connection closed");
          toast({
            title: `WebSocket connection closed`,
            description: `Now you are no longer connected to our servers`,
            status: "warning",
            duration: 4000,
            isClosable: true,
          });
        };

        ws.onerror = () => {
          console.error("Websocket connection error");
          toast({
            title: `WebSocket connection Error`,
            description: `Something went wrong with websockets`,
            status: "error",
            duration: 4000,
            isClosable: true,
          });
        };
      }
    } catch (error) {
      console.error(
        "Error while sending a text into the group from the client: ",
        error
      );
    }
  };

  useEffect(() => {
    if (ws && ws.OPEN) {
      // fetching users from the database from the database via websockets
      ws.onopen = () => {
        console.log("websocket connection opened successfully.");
        ws.send(
          JSON.stringify({
            action: "fetch-chat-partners",
          })
        );
      };

      ws.onmessage = (message) => {
        const data = JSON.parse(message.data);
        console.log(`Received message from the server: `, data);

        if (data.action === `receive-message`) {
          console.log(`message from ${data.from}: `, data.textMetadata);
          setLatestText({
            receivedBy: data.to,
            sentBy: data.from,
            latestText: data.textMetadata,
            sentAt: data.sentAt,
          });
          setChatHistory((prevChats) => [
            ...prevChats,
            {
              textMetadata: data.textMetadata,
              senderEmail: data.from,
              receiverEmail: data.to,
              sentAt: data.sentAt,
            },
          ]);
          toast({
            title: `Received message from ${data.from} successfully`,
            status: "success",
            duration: 4000,
            isClosable: true,
            position: "top-right",
          });
        } else if (data.action === "send-message") {
          setLatestText({
            receivedBy: data.to,
            sentBy: data.from,
            latestText: data.textMetadata,
            sentAt: data.sentAt,
          });
          setChatHistory((prevChats) => [
            ...prevChats,
            {
              textMetadata: data.textMetadata,
              senderEmail: data.from,
              receiverEmail: data.to,
              sentAt: data.sentAt,
            },
          ]);
          toast({
            title: `Message sent to ${data.to} successfully`,
            status: "success",
            duration: 4000,
            isClosable: true,
            position: "top-right",
          });
        } else if (
          data.message === `Message sent to ${currentChat} successfully`
        ) {
          toast({
            title: `Message sent successfully to ${currentChat}`,
            status: "success",
            duration: 4000,
            isClosable: true,
            position: "top-right",
          });
        } else if (
          data.message ===
          `Chat Partner not matching with the one in the socket`
        ) {
          toast({
            title: `Chat Partner Email mismatch happened`,
            status: "error",
            duration: 4000,
            isClosable: true,
            position: "top-right",
          });
          console.log("Chat Partner Email mismatch happened");
          return;
        } else if (
          data.message ===
          `All the chats have been fetched for ${currentUser?.email} successfully`
        ) {
          setChatPartnerViaSocket(data.chatPartners);
          toast({
            title: `All the chats have been fetched for ${currentUser?.email} successfully`,
            status: "success",
            duration: 4000,
            isClosable: true,
            position: "top-right",
          });
        } else if (data.action === "joined-group") {
          toast({
            title: data.title,
            status: "success",
            description: data.message,
            isClosable: true,
            position: "top-right",
            duration: 400,
          });
        } else if (data.action === "receive-group-message") {
          console.log("Received message from group: ", data.message);
          setGroupChatHistory((prevChats) => [
            ...prevChats,
            {
              groupId: data.targetGroup.id,
              groupName: data.targetGroup.name,
              senderId: Number(currentUser?.id),
              senderName: String(currentUser?.name),
              senderEmail: String(currentUser?.email),
              textMetadata: data.message,
              sentAt: data.sentAt,
            },
          ]);
          toast({
            title: `Received a message from ${data.targetGroup.name}`,
            status: "success",
            duration: 4000,
            isClosable: true,
            position: "top-right",
          });
        }
      };
    }

    return () => {
      if (ws) {
        ws.onmessage = null;
      }
    };
  }, [ws, toast, currentChat, currentUser, setChatHistory, setLatestText, setGroupChatHistory]);

  const handleCreateGroup = async () => {
    setGroupCreationLoading(true);
    try {
      console.log("Users to create a group with: ", usersToAddInTheGroup);
      if (ws && ws.OPEN) {
        ws.send(
          JSON.stringify({
            action: "create-group",
            groupName: groupName,
            // groupDescription giving undefined
            description: groupDescription,
            users: usersToAddInTheGroup,
          })
        );

        ws.onmessage = async (message) => {
          const data = JSON.parse(message.data);
          console.log("Received message from the server: ", data);
          if (data.message === "Group created successfully") {
            console.log("Group created successfully");
            await handleGetGroups();
            onClose();
            toast({
              title: `Group created successfully`,
              description: `You have successfully created a group ${groupName}`,
              status: "success",
              duration: 4000,
              isClosable: true,
              position: "top-right",
            });
          } else if (
            data.message ===
            "Client exists not true, user not found in the list of clients"
          ) {
            console.log(
              "Client exists not true, user not found in the list of clients"
            );
            toast({
              title: `Client exists not true, user not found in the list of clients`,
              status: "error",
              duration: 4000,
              isClosable: true,
            });
          } else if (data.status === "offline target user") {
            console.log(`${data.offlineUserEmail} is offline.`);
          } else if (data.status === "Target Client does not exist") {
            console.log("Target Client does not exist");
            toast({
              title: "Target Client does not exist",
              status: "error",
              duration: 4000,
              isClosable: true,
              position: "top-right",
            });
          } else if (data.action === "joined-group") {
            console.log(`You were put in a group named ${data.groupName} by ${data.admin}`);
            toast({
              title: `You joined a group ${data.groupName}`,
              status: "success",
              duration: 2000,
              isClosable: true,
              position: "top-right"
            });
          }
        };
      }
    } catch (error) {
      console.error("Error while creating a group: ", error);
    }
    setGroupCreationLoading(false);
  };

  const handleRetrieveChatsBetweenClients = useCallback(async () => {
    setLoadingChatHistory(true);
    try {
      const senderEmail = currentUser?.email as string;
      const receiverEmail = currentChat?.receiverEmail;
      const chats = await axios.get(
        `http://localhost:8000/retrievechats?senderEmail=${senderEmail}&receiverEmail=${receiverEmail}`,
        {
          withCredentials: true,
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );
      console.log(
        `Chats retrieved successfully between ${senderEmail} and ${receiverEmail}: `,
        chats.data.chats
      );
      setChatHistory(chats.data.chats);
      toast({
        title: `Chats retrieved successfully between ${senderEmail} and ${receiverEmail}`,
        status: "success",
        duration: 4000,
        isClosable: true,
        position: "top-right",
      });
    } catch (error) {
      console.error(`Error while fetching chats between clients: `, error);
    }
    setLoadingChatHistory(false);
  }, [currentUser, currentChat, toast, accessToken, setChatHistory]);

  useEffect(() => {
    handleRetrieveChatsBetweenClients();
  }, [handleRetrieveChatsBetweenClients]);

  const handleAddUserInGroup = async (user: User) => {
    try {
      const userIndex = usersToAddInTheGroup.findIndex((x) => x.id === user.id);
      if (userIndex !== -1) {
        usersToAddInTheGroup.splice(userIndex, 1);
        console.log(`${user.name} has been removed from the users list`);
        console.log("Another user removed: ", usersToAddInTheGroup);
      } else {
        usersToAddInTheGroup.push(user);
        console.log(
          "Total users added till now: ",
          usersToAddInTheGroup.length
        );
        console.log("Another user added: ", usersToAddInTheGroup);
      }
      console.log("Updated users in the list: ", usersToAddInTheGroup);
    } catch (error) {
      console.error("Error while adding/removing user in group: ", error);
    }
  };

  const handleGetGroupChatHistory = async (group: Group) => {
    try {
      const chatHistory = await axios.get(
        `${import.meta.env.VITE_BASE_URL}/get/group/allchat?groupId=${
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
        "Chat history retrieved successfully: ",
        chatHistory.data.chatHistory
      );
      setGroupChatHistory(chatHistory.data.chatHistory);
    } catch (error) {
      console.error("Error while fetching group chat history: ", error);
    }
  };

  const handleClickOnAnyGroup = async (group: Group) => {
    try {
      setGroupWindow(true);
      setChatWindow(false);
      setGroupChat(group);

      await handleGetGroupChatHistory(group);
    } catch (error) {
      console.error("Error while clicking on any group: ", error);
    }
  };

  return (
    <div className="w-full flex justify-start items-center h-[100%]">
      <div className="w-[99%] h-[97%] bg-slate-300 rounded-2xl">
        <div className="w-full h-full flex flex-row">
          <div className="w-[25%] h-[100%] flex flex-col">
            <div className="w-full flex justify-center pt-4">
              <input
                type="search"
                name=""
                className="w-[90%] py-2 pl-4 bg-slate-400 text-white rounded-lg placeholder:text-white font-Philosopher"
                placeholder="Search"
                onClick={() => {
                  setSearchUsersLoading(true);
                  setCreateGroupModal(false);
                  onOpen();
                  getUsersFromDB();
                }}
              />
            </div>
            <div className="w-full flex flex-col gap-2 justify-center items-center pt-2">
              {displayIndividualChats &&
                (loadingPartners
                  ? "Loading your partners..."
                  : chatPartners.length > 0
                  ? chatPartners.map((partner, index) => {
                      // setLastChat(partner.latestChat);
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
                                  : partner.updatedAt &&
                                    handleDateFormat(partner.updatedAt)}
                              </div>
                            </div>
                            <div className="w-full h-[60%] whitespace-nowrap overflow-hidden text-ellipsis pr-2">
                              {latestText.sentBy === partner.chatPartnerEmail
                                ? latestText.latestText
                                : partner.latestChat}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  : "Users you chat with will appear here.")}
              {displayGroups &&
                (loadingGroups ? (
                  "Loading your groups"
                ) : (
                  <div className="w-full flex flex-col">
                    <div className="w-full flex justify-center">
                      <button
                        type="button"
                        className="px-2 py-2 rounded-md bg-slate-400 text-black transition ease-in-out duration-200 hover:bg-slate-200 hover:cursor-pointer font-Philosopher"
                        onClick={() => {
                          setCreateGroupModal(true);
                          setSearchUsersLoading(false);
                          onOpen();
                          getUsersFromDB();
                        }}
                      >
                        Create group
                      </button>
                    </div>
                    {groups.length > 0 ? (
                      <div className="w-full flex flex-col gap-2 items-center pt-3">
                        {groups.map((group, index) => (
                          <div
                            className="w-[90%] bg-slate-200 rounded-md px-2 py-2 hover:cursor-pointer transition duration-150 ease-in-out hover:bg-gray-400 font-Philosopher font-bold"
                            key={index}
                            onClick={() => {
                              console.log("Group Details: ", group);
                              handleClickOnAnyGroup(group);
                            }}
                          >
                            <div className="">{group.name}</div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="w-full flex justify-center">
                        <div className="w-[80%]">
                          Sorry, you are not a part of any group
                        </div>
                      </div>
                    )}
                  </div>
                ))}
            </div>
          </div>
          {loadingWindow
            ? "Loading Chat Window..."
            : !chatWindow &&
              !groupWindow && (
                <div className="w-[75%] h-[100%] bg-slate-400 flex flex-col rounded-r-2xl">
                  <div className="w-full h-[90%] flex justify-center items-center">
                    <p className="font-bold font-Philosopher">
                      This is your alternative to the <br /> Boring Whats-App
                      you have been using!
                    </p>
                  </div>
                  <div className="w-full h-[10%] flex justify-center">
                    <p className="flex items-center gap-2 font-semibold font-Philosopher">
                      <CiLock />
                      Your personal messages are end-to-end encrypted
                    </p>
                  </div>
                </div>
              )}
          {chatWindow && currentChat !== null && currentChatName !== null && (
            <div className="w-[75%] h-[100%] bg-slate-400 rounded-r-2xl flex flex-col justify-between">
              {/* upper bar containing the name of the receiver */}
              <div className="w-full h-[10%] flex flex-row bg-slate-500 rounded-tr-2xl">
                <div className="w-[10%] flex justify-center items-center">
                  <div className="p-3 bg-slate-400 rounded-xl">
                    <FaUser className="text-[2rem]" />
                  </div>
                </div>
                <div className="w-[60%] flex justify-start items-center">
                  <p className="text-xl font-Philosopher font-semibold">
                    {currentChatName}
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
              {/* space for texts to appear */}
              <div
                className="w-full h-[80%] flex-col-reverse overflow-y-auto p-4 bg-slate-400"
                id="message-container"
              >
                {loadingChatHistory
                  ? "Loading your chats, please wait..."
                  : chatHistory.map((chat, index) =>
                      chat.senderEmail === currentUser?.email ? (
                        <div className="flex justify-end pt-2" key={index}>
                          <div className="p-3 bg-green-500 rounded-lg max-w-[70%] flex flex-col">
                            <div className="w-full">
                              <p className="text-white">{chat.textMetadata}</p>
                            </div>
                            <div className="w-full flex justify-end text-[0.7rem]">
                              {handleDateFormat(chat.sentAt)}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="flex justify-start pt-2" key={index}>
                          <div className="p-3 bg-blue-500 rounded-lg max-w-[70%] flex flex-col">
                            <div className="w-full">
                              <p className="text-white">{chat.textMetadata}</p>
                            </div>
                            <div className="w-full flex justify-end text-[0.7rem]">
                              {handleDateFormat(chat.sentAt)}
                            </div>
                          </div>
                        </div>
                      )
                    )}
              </div>
              {/* lower bar containing the text input for sending the texts */}
              <div className="w-full bg-slate-500 flex flex-row h-[3.5rem]">
                <div className="w-[5%] flex justify-center items-center">
                  <GoPaperclip className="text-[1.5rem]" />
                </div>
                <div className="w-[80%] flex justify-start items-center">
                  <div className="w-[90%]">
                    <input
                      type="text"
                      name=""
                      id=""
                      className="w-full px-3 py-2 h-[2rem] bg-slate-200 font-Poppins rounded-lg"
                      placeholder="Your Message"
                      onChange={(e: ChangeEvent<HTMLInputElement>) => {
                        e.preventDefault();
                        setTextMessage(e.target.value);
                      }}
                    />
                  </div>
                </div>
                <div className="w-[15%] flex flex-row">
                  <div className="basis-1/2 flex justify-center items-center">
                    <div className="p-3 bg-slate-600 rounded-full hover:cursor-pointer hover:bg-red-400">
                      <MdKeyboardVoice className="text-[1.5rem]" />
                    </div>
                  </div>
                  <div className="basis-1/2 flex justify-center items-center">
                    <div
                      className="p-3 bg-slate-600 hover:cursor-pointer hover:bg-green-500 rounded-full"
                      onClick={() => {
                        handleSendButtonClick(
                          currentChat?.receiverId as number,
                          currentChat?.receiverName as string,
                          currentChat?.receiverEmail as string
                        );
                      }}
                    >
                      <IoSend className="text-[1.5rem]" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          {groupWindow && groupChat && (
            <>
              <div
                className={`w-[${resizeWidth}%] h-[100%] bg-slate-400 rounded-r-2xl flex flex-col justify-between`}
              >
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
                {/* space for texts to appear */}
                <div
                  className="w-full h-[80%] flex-col-reverse overflow-y-auto p-4 bg-slate-400"
                  id="message-container"
                >
                  {loadingChatHistory
                    ? "Loading your chats, please wait..."
                    : groupChatHistory.map((chat, index) =>
                        chat.senderEmail === currentUser?.email ? (
                          <div className="flex justify-end pt-2" key={index}>
                            <div className="p-3 bg-green-500 rounded-lg max-w-[70%] flex flex-col">
                              <div className="w-full font-Philosopher">You</div>
                              <div className="w-full">
                                <p className="text-white">
                                  {chat.textMetadata}
                                </p>
                              </div>
                              <div className="w-full flex justify-end text-[0.7rem]">
                                {handleDateFormat(chat.sentAt)}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="flex justify-start pt-2" key={index}>
                            <div className="p-3 bg-blue-500 rounded-lg max-w-[70%] flex flex-col">
                              <div className="w-full font-Philosopher">
                                {chat.senderName}
                              </div>
                              <div className="w-full">
                                <p className="text-white">
                                  {chat.textMetadata}
                                </p>
                              </div>
                              <div className="w-full flex justify-end text-[0.7rem]">
                                {handleDateFormat(chat.sentAt)}
                              </div>
                            </div>
                          </div>
                        )
                      )}
                </div>
                {/* lower bar containing the text input for sending the texts */}
                <div className="w-full bg-slate-500 flex flex-row h-[3.5rem] rounded-br-2xl">
                  <div className="w-[5%] flex justify-center items-center">
                    <GoPaperclip className="text-[1.5rem]" />
                  </div>
                  <div className="w-[80%] flex justify-start items-center">
                    <div className="w-[90%]">
                      <input
                        type="text"
                        name=""
                        id=""
                        className="w-full px-3 py-2 h-[2rem] bg-slate-200 font-Poppins rounded-lg"
                        placeholder="Your Message"
                        onChange={(e: ChangeEvent<HTMLInputElement>) => {
                          e.preventDefault();
                          setGroupTextMessage(e.target.value);
                        }}
                      />
                    </div>
                  </div>
                  <div className="w-[15%] flex flex-row">
                    <div className="basis-1/2 flex justify-center items-center">
                      <div className="p-3 bg-slate-600 rounded-full hover:cursor-pointer hover:bg-red-400">
                        <MdKeyboardVoice className="text-[1.5rem]" />
                      </div>
                    </div>
                    <div className="basis-1/2 flex justify-center items-center">
                      <div
                        className="p-3 bg-slate-600 hover:cursor-pointer hover:bg-green-500 rounded-full"
                        onClick={() => {
                          handleGroupSendButtonClick(
                            groupChat,
                            groupTextMessage
                          );
                        }}
                      >
                        <IoSend className="text-[1.5rem]" />
                      </div>
                    </div>
                  </div>
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
          )}
        </div>
      </div>

      {/* modal for searching users */}
      <div className="">
        {searchUsersLoading && (
          <Modal isOpen={isOpen} onClose={onClose} isCentered size={"lg"}>
            <ModalOverlay />
            <ModalContent>
              <ModalHeader>
                <p className="font-Poppins">Search Users via email:</p>
              </ModalHeader>
              <ModalCloseButton />
              <ModalBody>
                {loading ? (
                  "getting all users..."
                ) : (
                  <div className="w-full flex flex-col gap-2">
                    {users &&
                      users.map((user, index) => (
                        <div
                          className="w-full flex flex-row py-4 bg-slate-400 rounded-xl"
                          key={index}
                        >
                          <div className="w-[20%] flex justify-center items-center">
                            <div className="w-[60%] bg-slate-200 rounded-full flex justify-center items-center p-3">
                              <FaUser className="w-7 h-7" />
                            </div>
                          </div>
                          <div className="w-[60%] flex flex-col font-Poppins">
                            <div className="w-full pl-4">
                              <p className="font-bold">{user.name}</p>
                            </div>
                            <div className="w-full pl-4">
                              <p className="">{user.email}</p>
                            </div>
                          </div>
                          <div className="w-[20%] flex justify-center items-center">
                            <button
                              type="button"
                              className="px-4 py-1 bg-neutral-900 transition ease-in-out duration-200 text-slate-400 rounded-md hover:cursor-pointer hover:text-white"
                              onClick={() => {
                                handleChatButtonClick(
                                  Number(user.id),
                                  String(user.name),
                                  user.email
                                );
                                insertingChatPartnerInDB(
                                  currentUser?.id as number,
                                  user.id as number,
                                  currentUser?.name as string,
                                  currentUser?.email as string,
                                  user.name as string,
                                  user.email
                                );
                              }}
                            >
                              Chat
                            </button>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </ModalBody>

              <ModalFooter>
                <button
                  type="button"
                  className="px-4 py-1 rounded-md hover:cursor-pointer font-Poppins hover:bg-slate-200 transition duration-200 ease-in-out"
                  onClick={onClose}
                >
                  Close
                </button>
              </ModalFooter>
            </ModalContent>
          </Modal>
        )}
      </div>

      {/* modal for creating groups */}
      <div className="">
        {createGroupModal && (
          <Modal isOpen={isOpen} onClose={onClose} isCentered size={"xl"}>
            <ModalOverlay />
            <ModalContent>
              <ModalHeader>
                <div className="w-full flex justify-center items-center">
                  You are creating a group
                </div>
              </ModalHeader>
              <ModalCloseButton />
              <ModalBody className="bg-slate-200">
                {loading ? (
                  "getting all users..."
                ) : (
                  <div className="w-full flex flex-row">
                    <div className="w-[40%] flex flex-col gap-2">
                      <div className=""></div>
                      <div className="w-full flex flex-row items-center">
                        <div className="w-[90%]">
                          <input
                            type="text"
                            name=""
                            id="name"
                            className="w-full bg-slate-400 placeholder:text-slate-200 px-2 py-1 rounded-md hover:cursor-pointer"
                            placeholder="Name"
                            onChange={(e) => {
                              setGroupName(e.target.value);
                            }}
                          />
                        </div>
                      </div>
                      <div className="w-full flex flex-row items-center">
                        <div className="w-[90%]">
                          <input
                            type="text"
                            name=""
                            id="description"
                            className="w-full bg-slate-400 placeholder:text-slate-200 px-2 py-1 rounded-md hover:cursor-pointer"
                            placeholder="Description"
                            onChange={(e) => {
                              setGroupDescription(e.target.value);
                            }}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="w-[60%] flex flex-col gap-2 overflow-y-auto max-h-[16rem]">
                      {users &&
                        users.map((user, index) => (
                          <div
                            className="w-full flex flex-row py-4 bg-slate-400 rounded-xl"
                            key={index}
                          >
                            <div className="w-[60%] flex flex-col font-Poppins">
                              <div className="w-full pl-4">
                                <p className="font-bold">{user.name}</p>
                              </div>
                            </div>
                            <div className="w-[40%] flex justify-center items-center">
                              <button
                                type="button"
                                className="px-4 py-1 bg-neutral-900 transition ease-in-out duration-200 text-slate-400 rounded-md hover:cursor-pointer hover:text-white"
                                onClick={() => {
                                  handleAddUserInGroup(user);
                                }}
                              >
                                {usersToAddInTheGroup.includes(user)
                                  ? "Remove"
                                  : "Add"}
                              </button>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </ModalBody>

              <ModalFooter className="bg-slate-200">
                <div className="w-full flex justify-center">
                  <button
                    type="button"
                    className="px-3 py-2 rounded-md hover:cursor-pointer bg-green-600 font-Philosopher transition ease-in-out duration-200 hover:bg-green-500 font-bold"
                    onClick={() => {
                      // handleCreateGroup();
                      console.log("group name: ", groupName);
                      console.log("group description: ", groupDescription);
                      console.log("users to be added: ", usersToAddInTheGroup);
                      handleCreateGroup();
                    }}
                  >
                    {groupCreationLoading
                      ? "Creating, Please Wait..."
                      : "Create Group"}
                  </button>
                </div>
              </ModalFooter>
            </ModalContent>
          </Modal>
        )}
      </div>
    </div>
  );
};

export default TextingSection;
