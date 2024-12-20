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
import { useWebSocket } from "../../hooks/UseWebsocket";
import { useCallback, useEffect, useState } from "react";
import { useToast } from "@chakra-ui/react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import {
  AccessTokenRefreshSuccess,
  LogoutSuccess,
} from "../../redux/slices/user.slice";
import { ChatHistory, Group, GroupChatHistory, latestTextWithUser } from "../../lib/interface";

const ClientDashboard = () => {
  const { currentUser, accessToken } = useAppSelector((state) => state.user);
  const [token, setToken] = useState<string>("");
  const [latestText, setLatestText] = useState<latestTextWithUser>({
    receivedBy: "",
    sentBy: "",
    latestText: "",
    sentAt: new Date(0),
  });
  const [chatHistory, setChatHistory] = useState<ChatHistory[]>([]);
  const ws = useWebSocket();
  const toast = useToast();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [displayIndividualChats, setDisplayIndividualChats] =
    useState<boolean>(true);
  const [displayGroups, setDisplayGroups] = useState<boolean>(false);
  const [loadingGroups, setLoadingGroups] = useState<boolean>(false);
  const [groups, setGroups] = useState<Group[]>([]);
  const [groupChatHistory, setGroupChatHistory] = useState<GroupChatHistory[]>(
    []
  );

  const getToken = useCallback(
    async (userId: number) => {
      try {
        const getTokenResponse = await axios.get(
          `http://localhost:8000/readtoken?id=${userId}`,
          {
            withCredentials: true,
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json",
            },
          }
        );
        console.log("token received is: ", getTokenResponse.data);
        if (
          getTokenResponse.status === 500 &&
          getTokenResponse.data.success === false
        ) {
          console.log("access token has expired, making a new one...");
          const refreshAccessToken = await axios.post(
            `http://localhost:8000/refresh?id=${userId}`
          );
          console.log(
            "access token refreshed response: ",
            refreshAccessToken.data
          );
          dispatch(
            AccessTokenRefreshSuccess(refreshAccessToken.data.accessToken)
          ); // sets the access token in redux or in memory
          await getToken(currentUser?.id as number);
        }
        setToken(getTokenResponse.data.token); // sets the refresh token
      } catch (error) {
        console.error("Error while getting token: ", error);
      }
    },
    [accessToken, currentUser?.id, dispatch]
  );

  useEffect(() => {
    getToken(currentUser?.id as number);
  }, [currentUser, getToken]);

  // function for user logging out
  const handleLogOut = async () => {
    try {
      const logoutResponse = await axios.post(
        `http://localhost:8000/logout?id=${currentUser?.id}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );
      console.log("Logout message: ", logoutResponse);
      dispatch(LogoutSuccess());
      navigate("/");
      toast({
        title: "Logout Successful",
        description: `You have successfully logged out of Nebula. See you soon, ${currentUser?.name}`,
        status: "success",
        duration: 4000,
        isClosable: true,
        position: "top-right",
      });
    } catch (error) {
      console.error("Error while logging out: ", error);
    }
  };

  const handleGetGroups = useCallback(async () => {
    setLoadingGroups(true);
    try {
      const response = await axios.get(
        `http://localhost:8000/get/groups?id=${currentUser?.id}`,
        {
          withCredentials: true,
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        }
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
  }, [currentUser, accessToken, toast]);

  // once the user reaches the main chatting page, he/she is immediately to connected to websockets
  // so that, the user is shown online
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
        if (data.message === "Authentication failed") {
          console.log("Authentication failed");
          toast({
            title: `Authentication of your token failed in the websockets`,
            status: "error",
            duration: 4000,
            isClosable: true,
          });
        } else if (
          data.message === `Welcome to the chat, ${currentUser.email}`
        ) {
          console.log("Authentication of your token has been completed");
          toast({
            title: `${currentUser.name} has been authenticated`,
            status: "success",
            duration: 4000,
            isClosable: true,
          });
        } else if (data.action === "receive-message") {
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
          toast({
            title: `${data.from} has sent a message`,
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
        } else if (data.action === "joined-group") {
          console.log(
            `You were put in a group named ${data.groupName} by ${data.admin}`
          );
          await handleGetGroups()
          toast({
            title: `You joined a group ${data.groupName}`,
            status: "success",
            duration: 2000,
            isClosable: true,
            position: "top-right",
          });
        } else if (data.action === "receive-group-message") {
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
        } else if (data.action === "admin-change-and-exit-group") {
          console.log("Received a message in the group: ", data.message);
          toast({
            title: data.title,
            description: data.message,
            status: "info",
            duration: 4000,
            isClosable: true,
            position: "top-right"
          });
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
  }, [currentUser, ws, toast, navigate, token, accessToken, latestText, handleGetGroups]);

  return (
    <div className="max-h-screen bg-neutral-900 flex flex-row relative w-full">
      {ws ? (
        <>
          <div className="w-[6%] min-h-screen flex flex-col items-center justify-center bg-transparent z-20 px-1 font-Philosopher">
            <div
              className="w-full hover:bg-slate-700 py-4 rounded-md hover:cursor-pointer transition duration-200 ease-in-out hover:text-slate-400 text-slate-400"
              onClick={() => {
                setDisplayIndividualChats(true);
                setDisplayGroups(false);
              }}
            >
              <div className="w-full flex justify-center">
                <BsChatSquareFill className="w-7 h-7" />
              </div>
              <div className="w-full flex justify-center">
                <p className="text-sm text-slate-400">All Chats</p>
              </div>
            </div>
            <div
              className="w-full hover:bg-slate-700 py-4 rounded-md hover:cursor-pointer transition duration-200 ease-in-out hover:text-slate-400 text-slate-400"
              onClick={() => {
                setDisplayGroups(true);
                setDisplayIndividualChats(false);
                handleGetGroups();
              }}
            >
              <div className="w-full flex justify-center">
                <MdOutlineWork className="w-7 h-7" />
              </div>
              <div className="w-full flex justify-center">
                <p className="text-sm text-slate-400">Group</p>
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
            <div
              className="w-full hover:bg-slate-700 py-4 rounded-md hover:cursor-pointer transition duration-200 ease-in-out hover:text-slate-400 text-slate-400"
              onClick={handleLogOut}
            >
              <div className="w-full flex justify-center pr-2">
                <SlLogout className="w-7 h-7" />
              </div>
              <div className="w-full flex justify-center">
                <p className="text-sm text-slate-400">Log out</p>
              </div>
            </div>
          </div>
          <div className="w-[94%] min-h-screen z-20">
            <TextingSection
              token={token}
              latestText={latestText}
              setLatestText={setLatestText}
              ws={ws}
              chatHistory={chatHistory}
              setChatHistory={setChatHistory}
              displayGroups={displayGroups}
              displayIndividualChats={displayIndividualChats}
              groups={groups}
              loadingGroups={loadingGroups}
              handleGetGroups={handleGetGroups}
              groupChatHistory={groupChatHistory}
              setGroupChatHistory={setGroupChatHistory}
            />
          </div>
        </>
      ) : (
        <div className="w-full">
          <p className="">No Websocket instance found</p>
        </div>
      )}

      <StarsBackground />
      <ShootingStars minDelay={2000} maxDelay={3000} />
    </div>
  );
};

export default ClientDashboard;
