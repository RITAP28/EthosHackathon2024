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
import { ChatHistory, latestTextWithUser } from "../../lib/interface";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Button,
} from "@chakra-ui/react";
import { User } from "../../lib/interface";

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

  const { isOpen, onOpen, onClose } = useDisclosure();

  const [usersLoading, setUsersLoading] = useState<boolean>(false);
  const [users, setUsers] = useState<User[]>([]);

  const [groupCreationLoading, setGroupCreationLoading] = useState<boolean>(false);
  const [groupName, setGroupName] = useState<string | null>(null);
  const [groupDescription, setGroupDescription] = useState<string | null>(null);

  const usersToAddInTheGroup: User[] = [];

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

  // function for getting users from database
  const getUserFromDB = async () => {
    setUsersLoading(true);
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_BASE_URL}/getusersfromdb?id=${currentUser?.id}`,
        {
          withCredentials: true,
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );
      setUsers(response.data.users);
    } catch (error) {
      console.error("Error while getting users from datavbase: ", error);
    }
    setUsersLoading(false);
  };

  const handleCreateGroup = async () => {
    setGroupCreationLoading(true);
    try {
      console.log("Users to create a group with: ", usersToAddInTheGroup);
      if(ws && ws.OPEN){
        ws.send(
          JSON.stringify({
            action: "create-group",
            groupName: groupName,
            description: groupDescription,
            users: usersToAddInTheGroup
          })
        );
      }
    } catch (error) {
      console.error("Error while creating a group: ", error);
    }
    setGroupCreationLoading(false);
  };

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

      ws.onmessage = (message) => {
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
  }, [currentUser, ws, toast, navigate, token, accessToken, latestText]);

  return (
    <div className="max-h-screen bg-neutral-900 flex flex-row relative w-full">
      {ws ? (
        <>
          <div className="w-[6%] min-h-screen flex flex-col items-center justify-center bg-transparent z-20 px-1 font-Philosopher">
            <div className="w-full hover:bg-slate-700 py-4 rounded-md hover:cursor-pointer transition duration-200 ease-in-out hover:text-slate-400 text-slate-400">
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
                onOpen();
                getUserFromDB();
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
            />
          </div>
        </>
      ) : (
        <div className="w-full">
          <p className="">No Websocket instance found</p>
        </div>
      )}

      {/* modal for creating groups */}
      <div className="">
        <Modal isOpen={isOpen} onClose={onClose} isCentered size={"lg"}>
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Modal Title</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              {usersLoading ? (
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
                              usersToAddInTheGroup.push(user);
                            }}
                          >
                            Add
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </ModalBody>

            <ModalFooter>
              <div className="w-full flex justify-center">
                <button type="button" className="px-3 py-1 rounded-md hover:cursor-pointer bg-red-400">
                  Create Group
                </button>
              </div>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </div>

      <StarsBackground />
      <ShootingStars minDelay={2000} maxDelay={3000} />
    </div>
  );
};

export default ClientDashboard;
