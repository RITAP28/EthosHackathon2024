/* eslint-disable no-console */
import axios from 'axios';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { PiChatsBold } from 'react-icons/pi';
import { FaUsers } from 'react-icons/fa';
import { BiLoaderCircle } from 'react-icons/bi';
import {
  useToast,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Button,
} from '@chakra-ui/react';
import { useAppSelector } from '../../redux/hooks/hook';
import { LogoutSuccess } from '../../redux/slices/user.slice';
import { useWebSocket } from '../../context/WebSocket';

interface Users {
  id: number;
  name: string;
  email: string;
  isAuthenticated: boolean;
}

function Landing() {
  const { currentUser } = useAppSelector((state) => state.user);
  const ws = useWebSocket();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [users, setUsers] = useState<Users[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const handleLogout = async (userId: number) => {
    try {
      const logoutResponse = await axios.post(
        `http://localhost:8000/logout?id=${userId}`,
        {
          withCredentials: true,
        },
      );
      console.log('Logged out successfully: ', logoutResponse.data);
      dispatch(LogoutSuccess());
      navigate('/login');
    } catch (error) {
      console.error('Error while logging out: ', error);
    }
  };

  const getUsersFromDatabase = async () => {
    setLoading(true);
    try {
      const usersResponse = await axios.get(
        `http://localhost:8000/getusersfromdb?id=${currentUser?.id}`,
        {
          withCredentials: true,
        },
      );
      console.log('Users from database: ', usersResponse.data);
      setUsers(usersResponse.data.users);
    } catch (error) {
      console.error('Error while fetching users from database: ', error);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
    } else if (ws) {
      // Send token over WebSocket once it's available and the connection is established
      console.log('Current WebSocket instance:', ws);
      ws.onopen = () => {
        console.log('WebSocket connection established!');
        toast({
          title: 'Connected to Socket',
          status: 'success',
          duration: 4000,
          isClosable: true,
        });
      };

      ws.onmessage = (message) => {
        console.log('Received message: ', message);
      };

      ws.onerror = () => {
        console.error('Websocket connection error');
      };

      ws.onclose = () => {
        console.log('WebSocket connection closed');
      };
    }
  }, [currentUser, navigate, toast, ws]);

  return (
    <div>
      {ws ? (
        <div className="w-full h-screen">
          <div className="w-full h-[7%] bg-emerald-600 text-white flex flex-row justify-between items-center">
            <div className="pl-3 text-[1.5rem] font-Philosopher font-bold text-black">{`WhatsApp for ${currentUser?.name}`}</div>
            <div className="pr-3">
              <button
                type="button"
                className="px-5 py-2 bg-green-700 transform duration-200 ease-in-out hover:bg-green-900 hover:text-white rounded-md hover:cursor-pointer text-white font-Philosopher"
                onClick={() => {
                  handleLogout(currentUser?.id as number);
                }}
              >
                Logout
              </button>
            </div>
          </div>
          <div className="w-full h-[93%] flex flex-row bg-slate-700">
            <div className="w-[5%] bg-slate-800 flex flex-col">
              <div className="w-full py-2 flex justify-center items-center">
                <div className="bg-black text-white hover:bg-white hover:cursor-pointer hover:text-black transition duration-200 ease-in-out p-3 rounded-full text-[1.5rem]">
                  <PiChatsBold />
                </div>
              </div>
              <div className="w-full py-2 flex justify-center items-center">
                <div className="bg-black text-white hover:bg-white hover:cursor-pointer hover:text-black transition duration-200 ease-in-out p-3 rounded-full text-[1.5rem]">
                  <BiLoaderCircle />
                </div>
              </div>
            </div>
            <div className="w-[25%] bg-emerald-700 h-[100%]">
              <div className="w-full flex flex-col">
                <div className="w-full flex flex-col bg-green-950 h-[10%]">
                  <div className="w-full pt-4 pb-3 flex flex-row text-white">
                    <div className="w-[70%] flex justify-start pl-4 text-[1.5rem] items-center font-bold">
                      Chats
                    </div>
                    <div className="w-[30%] flex justify-end pr-4">
                      <button
                        type="button"
                        className="px-3 py-3 rounded-full bg-black text-white hover:cursor-pointer hover:bg-white hover:text-black"
                        onClick={() => {
                          getUsersFromDatabase();
                          onOpen();
                        }}
                      >
                        <FaUsers />
                      </button>
                    </div>
                  </div>
                  <div className="w-full pt-2 pb-4 flex justify-center items-center">
                    <input
                      type="search"
                      className="w-[90%] py-2 rounded-md bg-slate-400 placeholder:text-slate-600 pl-4 hover:cursor-pointer hover:bg-slate-300 font-semibold"
                      name=""
                      id=""
                      placeholder="Search..."
                    />
                  </div>
                </div>
                <div className="w-full h-[90%]">
                  <div className="w-full flex flex-row justify-center font-medium items-center">
                    Start texting your friends/family here...
                  </div>
                </div>
              </div>
            </div>
            <div className="w-[70%] h-full flex justify-center items-center text-[2rem]">
              This project is for <span className="font-bold px-3">Ethos</span>{' '}
              Hackathon
            </div>
          </div>
          <div>
            <Modal isOpen={isOpen} onClose={onClose} isCentered>
              <ModalOverlay />
              <ModalContent>
                <div className="bg-emerald-600">
                  <ModalHeader className="flex justify-center">
                    Click on Chat and start texting
                  </ModalHeader>
                  <ModalCloseButton />
                  <ModalBody>
                    <div className="w-full flex flex-col gap-2 text-white">
                      {loading
                        ? 'Getting users...'
                        : users.map((user) => (
                            <div
                              className="p-2 border-green-800 border-2 rounded-lg w-full flex flex-row bg-emerald-800"
                              key={user.id}
                            >
                              <div className="w-[80%] flex items-center">
                                <div>
                                  <div className="font-bold">{user.name}</div>
                                  <div>{user.email}</div>
                                </div>
                              </div>
                              <div className="w-[20%] flex items-center">
                                <button
                                  type="button"
                                  className="px-3 py-1 rounded-lg bg-black text-white hover:cursor-pointer hover:bg-white hover:text-black transition ease-in-out duration-200"
                                >
                                  Chat
                                </button>
                              </div>
                            </div>
                          ))}
                    </div>
                  </ModalBody>

                  <ModalFooter>
                    <Button colorScheme="blue" mr={3} onClick={onClose}>
                      Close
                    </Button>
                  </ModalFooter>
                </div>
              </ModalContent>
            </Modal>
          </div>
        </div>
      ) : (
        <div>You are not connected to socket</div>
      )}
    </div>
  );
}

export default Landing;
