import { useToast } from "@chakra-ui/react";
import { useAppSelector } from "../redux/hooks/hook";
import { useWebSocket } from "./UseWebsocket";
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ChatHistory,
  Group,
  GroupChatHistory,
  latestTextWithUser,
} from "../utils/interface";
import axios from "axios";
import { baseUrl, createConfig } from "../utils/util";
import showSuccessToast from "../components/ui/toasts/showSuccessToast";

const useWebSocketConnection = (token: string) => {
  const { currentUser, accessToken } = useAppSelector((state) => state.user);
  const ws = useWebSocket();
  const toast = useToast();
  const navigate = useNavigate();
  const config = createConfig(accessToken);
  const [latestText, setLatestText] = useState<latestTextWithUser>({
    receivedBy: "",
    sentBy: "",
    latestText: "",
    sentAt: new Date(0),
  });
  const [chatHistory, setChatHistory] = useState<ChatHistory[]>([]);
  const [groupChatHistory, setGroupChatHistory] = useState<GroupChatHistory[]>(
    []
  );

  const [loadingGroups, setLoadingGroups] = useState<boolean>(false);
  const [groups, setGroups] = useState<Group[]>([]);

  const handleGetGroups = useCallback(async () => {
    setLoadingGroups(true);
    try {
      const response = await axios.get(
        `${baseUrl}/get/groups?id=${currentUser?.id}`,
        config
      );
      console.log("Response for getting groups: ", response.data);
      setGroups(response.data.groups);
      toast({
        title: "Groups fetched successfully",
        status: "success",
        isClosable: true,
        position: "top-right",
        duration: 4000,
      });
    } catch (error) {
      console.error(
        `Error while fetching groups for ${currentUser?.name}: `,
        error
      );
    }
    setLoadingGroups(false);
  }, [currentUser, toast, config]);

  useEffect(() => {
    if (!currentUser) {
      navigate("/login");
    } else if (ws) {
      console.log("New Websocket instance established: ", ws);
      ws.onopen = () => {
        console.log(`${currentUser.name} is connected to websocket`);
        ws.send(
          JSON.stringify({
            action: "first-socket-authentication",
            token: accessToken,
          })
        );
      };

      ws.onmessage = async (message) => {
        console.log("Message received from server: ", message);
        const data = JSON.parse(message.data);
        console.log("data received from the server: ", data);
        switch (data.action) {
          case "Authentication failed":
            console.log("Authentication failed");
            toast({
              title: `Authentication of your token failed in the websockets`,
              status: "error",
              duration: 4000,
              isClosable: true,
            });
            break;
          case `Welcome to the chat, ${currentUser.email}`:
            console.log("Authentication of your token has been completed");
            toast({
              title: `${currentUser.name} has been authenticated`,
              status: "success",
              duration: 4000,
              isClosable: true,
            });
            break;
          case "receive-message":
            setLatestText({
              receivedBy: data.to,
              sentBy: data.from,
              latestText: data.textMetadata,
              sentAt: data.sentAt,
            });
            console.log(`message received successfully from ${data.from}`);
            console.log("received text: ", latestText);
            setChatHistory((prevChats) => [
              ...prevChats,
              {
                textMetadata: data.textMetadata,
                senderEmail: data.from,
                receiverEmail: data.to,
                sentAt: data.sentAt,
              },
            ]);
            showSuccessToast(
                toast,
                `${data.from} has sent a message`,
                `${data.from}: ${data.textMetadata}`
            );
            break;
          case "send-message":
            setLatestText({
              receivedBy: data.to,
              sentBy: data.from,
              latestText: data.textMetadata,
              sentAt: data.sentAt,
            });
            break;
          case "joined-group":
            console.log(
              `You were put in a group named ${data.groupName} by ${data.admin}`
            );
            await handleGetGroups();
            toast({
              title: `You joined a group ${data.groupName}`,
              status: "success",
              duration: 2000,
              isClosable: true,
              position: "top-right",
            });
            break;
          case "receive-group-message":
            console.log("Received message from group: ", data.message);
            setGroupChatHistory((prevChats) => [
              ...prevChats,
              {
                groupId: data.group.id,
                groupName: data.group.name,
                senderId: Number(data.from.id),
                senderName: String(data.from.name),
                senderEmail: String(data.from.email),
                textMetadata: data.message,
                sentAt: data.sentAt,
              },
            ]);
            toast({
              title: `Received a message in the group ${data.group.name}`,
              description: `${data.from.name}: ${data.message}`,
              status: "success",
              duration: 4000,
              isClosable: true,
              position: "top-right",
            });
            break;
          case "admin-change-and-exit-group":
            console.log("Received a message in the group: ", data.message);
            toast({
              title: data.title,
              description: data.message,
              status: "info",
              duration: 4000,
              isClosable: true,
              position: "top-right",
            });
            break;
          default:
            break;
        }
      };

      ws.onerror = () => {
        console.error("Websocket connection error");
      };

      ws.onclose = () => {
        console.log("Websocket connection closed");
        toast({
          title: `${currentUser.name} is disconnected from websocket`,
          status: "error",
          duration: 4000,
          isClosable: true,
        });
      };
    }
  }, [
    currentUser,
    token,
    ws,
    toast,
    navigate,
    token,
    accessToken,
    latestText,
    handleGetGroups,
    setChatHistory,
    setGroupChatHistory,
    setLatestText,
  ]);

  return {
    loadingGroups,
    groups,
    handleGetGroups,
    latestText,
    setLatestText,
    chatHistory,
    groupChatHistory,
    setChatHistory,
    setGroupChatHistory,
  };
};

export default useWebSocketConnection;
