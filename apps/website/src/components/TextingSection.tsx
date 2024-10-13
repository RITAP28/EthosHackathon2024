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
import { ChangeEvent, useEffect, useState } from "react";
import { ChatPartner, User } from "../lib/interface";
import axios from "axios";
import { useAppSelector } from "../redux/hooks/hook";
import { FaUser } from "react-icons/fa";
import { useWebSocket } from "../hooks/UseWebsocket";
import { CiLock } from "react-icons/ci";
import { FcVideoCall } from "react-icons/fc";
import { CiMenuKebab } from "react-icons/ci";
import { GoPaperclip } from "react-icons/go";
import { MdKeyboardVoice } from "react-icons/md";
import { IoSend } from "react-icons/io5";

const TextingSection = ({ token }: { token: string }) => {
  console.log(token);
  const { currentUser } = useAppSelector((state) => state.user);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [loading, setLoading] = useState<boolean>(false);
  const [users, setUsers] = useState<User[]>([]);

  // states for texting window
  const [currentChat, setCurrentChat] = useState<string>("");
  const [currentChatName, setCurrentChatName] = useState<string>("");
  const [chatWindow, setChatWindow] = useState<boolean>(false);
  const [loadingWindow, setLoadingWindow] = useState<boolean>(false);

  // states for chat partners
  const [chatPartners, setChatPartners] = useState<ChatPartner[]>([]);
  const [loadingPartners, setLoadingPartners] = useState<boolean>(false);

  const [textMessage, setTextMessage] = useState<string>("");

  const toast = useToast();

  const ws = useWebSocket();

  const getUsersFromDB = async () => {
    setLoading(true);
    try {
      const getUsersResponse = await axios.get(
        `http://localhost:8000/getusersfromdb?id=${currentUser?.id}`,
        {
          withCredentials: true,
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
          chatPartnerName,
          chatPartnerEmail,
        },
        {
          withCredentials: true,
        }
      );
      console.log("Response: ", insertChatPartnerResponse);
    } catch (error) {
      console.error("Error while inserting chat partner in database: ", error);
    }
  };

  const handleChatButtonClick = async (receiverEmail: string) => {
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
            setCurrentChat(receiverEmail);
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

  const fetchingChatPartnersFromDatabase = async (senderId: number) => {
    setLoadingPartners(true);
    try {
      const chatPartners = await axios.get(
        `http://localhost:8000/getchatpartnersfromdb?senderId=${senderId}`,
        {
          withCredentials: true,
        }
      );
      console.log("Here are your chat partners: ", chatPartners.data);
      setChatPartners(chatPartners.data.chatPartners);
    } catch (error) {
      console.error(
        "Error while fetching chat partners from database: ",
        error
      );
    }
    setLoadingPartners(false);
  };

  useEffect(() => {
    // getting the chat partners from the database
    fetchingChatPartnersFromDatabase(currentUser?.id as number);
  }, [currentUser]);

  const getDetailsAboutChatPartner = async (receiverEmail: string) => {
    try {
      const chatPartnerDetailResponse = await axios.get(
        `http://localhost:8000/getchatpartnerdetail`,
        {
          params: {
            receiverEmail,
          },
          withCredentials: true,
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

  const handleSendButtonClick = async (receiverEmail: string) => {
    try {
      if (ws && ws.OPEN) {
        ws.send(
          JSON.stringify({
            action: "send-message",
            targetEmail: receiverEmail,
            message: textMessage,
          })
        );

        ws.onmessage = (message) => {
          const data = JSON.parse(message.data);
          console.log("Received message from the server: ", data);
          if (
            data.message === `Message sent to ${receiverEmail} successfully`
          ) {
            toast({
              title: `Message sent successfully to ${receiverEmail}`,
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
            `Received message from ${receiverEmail} successfully`
          ) {
            toast({
              title: `Received message from ${receiverEmail} successfully`,
              status: "success",
              duration: 4000,
              isClosable: true,
              position: "top-right",
            });
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
      console.error("Error while sending message: ", error);
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
                  onOpen();
                  getUsersFromDB();
                }}
              />
            </div>
            <div className="w-full flex justify-center pt-2">
              {loadingPartners
                ? "Loading your partners..."
                : chatPartners.length > 0
                ? chatPartners.map((partner, index) => (
                    <div
                      className="w-[90%] bg-slate-400 flex flex-row py-2 rounded-xl hover:bg-slate-500 hover:cursor-pointer transition ease-in-out duration-200"
                      key={index}
                      onClick={() => {
                        handleChatButtonClick(partner.chatPartnerEmail);
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
                          <div className="">{"20m"}</div>
                        </div>
                        <div className="w-full h-[60%]">
                          {partner.chatPartnerId}
                        </div>
                      </div>
                    </div>
                  ))
                : "Users you chat with will appear here."}
            </div>
          </div>
          {loadingWindow ? (
            "Loading Chat Window..."
          ) : currentChat === "" && currentChatName === "" && !chatWindow ? (
            <div className="w-[75%] h-[100%] bg-slate-400 flex flex-col rounded-r-2xl">
              <div className="w-full h-[90%] flex justify-center items-center">
                <p className="font-bold font-Philosopher">
                  This is your alternative to the <br /> Boring Whats-App you
                  have been using!
                </p>
              </div>
              <div className="w-full h-[10%] flex justify-center">
                <p className="flex items-center gap-2 font-semibold font-Philosopher">
                  <CiLock />
                  Your personal messages are end-to-end encrypted
                </p>
              </div>
            </div>
          ) : (
            <div className="w-[75%] h-[100%] bg-slate-400 rounded-r-2xl flex flex-col justify-between">
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
                        handleSendButtonClick(currentChat);
                      }}
                    >
                      <IoSend className="text-[1.5rem]" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      <div className="">
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
                  {users.map((user, index) => (
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
                            handleChatButtonClick(user.email);
                            setCurrentChatName(user.name);
                            insertingChatPartnerInDB(
                              currentUser?.id as number,
                              user.id,
                              currentUser?.name as string,
                              user.name,
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
      </div>
    </div>
  );
};

export default TextingSection;