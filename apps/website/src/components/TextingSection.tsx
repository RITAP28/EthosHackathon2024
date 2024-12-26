import {
  useDisclosure,
  useToast,
} from "@chakra-ui/react";
import { useCallback, useEffect, useState } from "react";
import {
  ChatHistory,
  ChatPartner,
  CurrentChat,
  Group,
  GroupChatHistory,
  latestTextWithUser,
  User,
} from "../utils/interface";
import axios from "axios";
import { useAppSelector } from "../redux/hooks/hook";
import GroupChatWindow from "./TextingSection/GroupChat/GroupChatWindow";
import IndividualChatWindow from "./TextingSection/IndividualChat/IndividualChatWindow";
import NormalWindow from "./TextingSection/NormalWindow";
import GroupsSidePanel from "./TextingSection/GroupChat/GroupsSidePanel";
import ChatSidePanel from "./TextingSection/IndividualChat/ChatSidePanel";
import SearchUsersModal from "./TextingSection/Modals/SearchUsersModal";
import CreateGroupModal from "./TextingSection/Modals/CreateGroupModal";

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
  setGroupChatHistory,
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
  setGroupChatHistory: React.Dispatch<React.SetStateAction<GroupChatHistory[]>>;
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
    textMetadata: string
  ) => {
    try {
      if (ws && ws.OPEN) {
        console.log("Message successfully sent to the group");
        ws.send(
          JSON.stringify({
            action: "send-group-message",
            targetGroup: group,
            textMetadata: textMetadata,
            senderId: Number(currentUser?.id),
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

  // useEffect(() => {
  //   if (ws && ws.OPEN) {
  //     // fetching users from the database from the database via websockets
  //     ws.onopen = () => {
  //       console.log("websocket connection opened successfully.");
  //       ws.send(
  //         JSON.stringify({
  //           action: "fetch-chat-partners",
  //         })
  //       );
  //     };

  //     ws.onmessage = (message) => {
  //       const data = JSON.parse(message.data);
  //       console.log(`Received message from the server: `, data);

  //       if (data.action === `receive-message`) {
  //         console.log(`message from ${data.from}: `, data.textMetadata);
  //         setLatestText({
  //           receivedBy: data.to,
  //           sentBy: data.from,
  //           latestText: data.textMetadata,
  //           sentAt: data.sentAt,
  //         });
  //         setChatHistory((prevChats) => [
  //           ...prevChats,
  //           {
  //             textMetadata: data.textMetadata,
  //             senderEmail: data.from,
  //             receiverEmail: data.to,
  //             sentAt: data.sentAt,
  //           },
  //         ]);
  //         toast({
  //           title: `Received message from ${data.from} successfully`,
  //           status: "success",
  //           duration: 4000,
  //           isClosable: true,
  //           position: "top-right",
  //         });
  //       } else if (data.action === "send-message") {
  //         setLatestText({
  //           receivedBy: data.to,
  //           sentBy: data.from,
  //           latestText: data.textMetadata,
  //           sentAt: data.sentAt,
  //         });
  //         setChatHistory((prevChats) => [
  //           ...prevChats,
  //           {
  //             textMetadata: data.textMetadata,
  //             senderEmail: data.from,
  //             receiverEmail: data.to,
  //             sentAt: data.sentAt,
  //           },
  //         ]);
  //         toast({
  //           title: `Message sent to ${data.to} successfully`,
  //           status: "success",
  //           duration: 4000,
  //           isClosable: true,
  //           position: "top-right",
  //         });
  //       } else if (
  //         data.message === `Message sent to ${currentChat} successfully`
  //       ) {
  //         toast({
  //           title: `Message sent successfully to ${currentChat}`,
  //           status: "success",
  //           duration: 4000,
  //           isClosable: true,
  //           position: "top-right",
  //         });
  //       } else if (
  //         data.message ===
  //         `Chat Partner not matching with the one in the socket`
  //       ) {
  //         toast({
  //           title: `Chat Partner Email mismatch happened`,
  //           status: "error",
  //           duration: 4000,
  //           isClosable: true,
  //           position: "top-right",
  //         });
  //         console.log("Chat Partner Email mismatch happened");
  //         return;
  //       } else if (
  //         data.message ===
  //         `All the chats have been fetched for ${currentUser?.email} successfully`
  //       ) {
  //         setChatPartnerViaSocket(data.chatPartners);
  //         toast({
  //           title: `All the chats have been fetched for ${currentUser?.email} successfully`,
  //           status: "success",
  //           duration: 4000,
  //           isClosable: true,
  //           position: "top-right",
  //         });
  //       } else if (data.action === "joined-group") {
  //         toast({
  //           title: data.title,
  //           status: "success",
  //           description: data.message,
  //           isClosable: true,
  //           position: "top-right",
  //           duration: 400,
  //         });
  //       } else if (data.action === "receive-group-message") {
  //         console.log("Received message from group: ", data.message);
  //         setGroupChatHistory((prevChats) => [
  //           ...prevChats,
  //           {
  //             groupId: data.targetGroup.id,
  //             groupName: data.targetGroup.name,
  //             senderId: Number(currentUser?.id),
  //             senderName: String(currentUser?.name),
  //             senderEmail: String(currentUser?.email),
  //             textMetadata: data.message,
  //             sentAt: data.sentAt,
  //           },
  //         ]);
  //         toast({
  //           title: `Received a message from ${data.targetGroup.name}`,
  //           status: "success",
  //           duration: 4000,
  //           isClosable: true,
  //           position: "top-right",
  //         });
  //       }
  //     };
  //   }

  //   return () => {
  //     if (ws) {
  //       ws.onmessage = null;
  //     }
  //   };
  // }, [
  //   ws,
  //   toast,
  //   currentChat,
  //   currentUser,
  //   setChatHistory,
  //   setLatestText,
  //   setGroupChatHistory,
  // ]);

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
            console.log(
              `You were put in a group named ${data.groupName} by ${data.admin}`
            );
            toast({
              title: `You joined a group ${data.groupName}`,
              status: "success",
              duration: 2000,
              isClosable: true,
              position: "top-right",
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
              {displayIndividualChats && (
                <ChatSidePanel
                  loadingPartners={loadingPartners}
                  chatPartners={chatPartners}
                  setGroupWindow={setGroupWindow}
                  handleChatButtonClick={handleChatButtonClick}
                  latestText={latestText}
                  handleDateFormat={handleDateFormat}
                />
              )}
              {displayGroups && (
                <GroupsSidePanel
                  loadingGroups={loadingGroups}
                  setCreateGroupModal={setCreateGroupModal}
                  setSearchUsersLoading={setSearchUsersLoading}
                  onOpen={onOpen}
                  getUsersFromDB={getUsersFromDB}
                  groups={groups}
                  handleClickOnAnyGroup={handleClickOnAnyGroup}
                />
              )}
            </div>
          </div>
          {loadingWindow
            ? "Loading Chat Window..."
            : !chatWindow && !groupWindow && <NormalWindow />}
          {chatWindow && currentChat !== null && currentChatName !== null && (
            <IndividualChatWindow
              currentChatName={currentChatName}
              loadingChatHistory={loadingChatHistory}
              chatHistory={chatHistory}
              handleDateFormat={handleDateFormat}
              setTextMessage={setTextMessage}
              handleSendButtonClick={handleSendButtonClick}
              currentChat={currentChat}
            />
          )}
          {groupWindow && groupChat && (
            <>
              <GroupChatWindow
                loadingChatHistory={loadingChatHistory}
                groupChatHistory={groupChatHistory}
                handleDateFormat={handleDateFormat}
                resizeWidth={resizeWidth}
                setResizeWidth={setResizeWidth}
                setShowGroupInfo={setShowGroupInfo}
                groupChat={groupChat}
                setGroupTextMessage={setGroupTextMessage}
                handleGroupSendButtonClick={handleGroupSendButtonClick}
                groupTextMessage={groupTextMessage}
                showGroupInfo={showGroupInfo}
                setGroupWindow={setGroupWindow}
                setGroupChat={setGroupChat}
                handleGetGroups={handleGetGroups}
              />
            </>
          )}
        </div>
      </div>

      {/* modal for searching users */}
      <div className="">
        {searchUsersLoading && (
          <SearchUsersModal
            isOpen={isOpen}
            onClose={onClose}
            loading={loading}
            users={users}
            handleChatButtonClick={handleChatButtonClick}
            insertingChatPartnerInDB={insertingChatPartnerInDB}
          />
        )}
      </div>

      {/* modal for creating groups */}
      <div className="">
        {createGroupModal && (
          <CreateGroupModal
            isOpen={isOpen}
            onClose={onClose}
            loading={loading}
            setGroupName={setGroupName}
            setGroupDescription={setGroupDescription}
            users={users}
            handleAddUserInGroup={handleAddUserInGroup}
            usersToAddInTheGroup={usersToAddInTheGroup}
            groupName={groupName}
            groupDescription={groupDescription}
            handleCreateGroup={handleCreateGroup}
            groupCreationLoading={groupCreationLoading}
          />
        )}
      </div>
    </div>
  );
};

export default TextingSection;
