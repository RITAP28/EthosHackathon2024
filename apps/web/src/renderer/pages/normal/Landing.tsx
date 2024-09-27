/* eslint-disable no-console */
import axios from 'axios';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
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
          <div className="w-full h-[5%] bg-slate-600 text-white flex flex-row justify-between items-center">
            <div className="pl-3">{`WhatsApp for ${currentUser?.name}`}</div>
            <div className="pr-3">
              <button
                type="button"
                className="px-4 py-1 bg-white transform duration-200 ease-in-out hover:bg-black hover:text-white rounded-lg hover:cursor-pointer text-black"
                onClick={() => {
                  handleLogout(currentUser?.id as number);
                }}
              >
                Logout
              </button>
            </div>
          </div>
          <div className="w-full h-[95%] flex flex-row bg-slate-700">
            <div className="w-[20%] bg-slate-300">
              <div className="w-full">
                <button
                  type="button"
                  className="px-4 py-1 rounded-lg bg-black text-white hover:cursor-pointer hover:bg-white hover:text-black"
                  onClick={() => {
                    getUsersFromDatabase();
                    onOpen();
                  }}
                >
                  Users
                </button>
              </div>
            </div>
            <div className="w-[80%]">sdnjcjksdnc</div>
          </div>
          <div>
            <Modal isOpen={isOpen} onClose={onClose}>
              <ModalOverlay />
              <ModalContent>
                <ModalHeader>Modal Title</ModalHeader>
                <ModalCloseButton />
                <ModalBody>
                  <div className="w-full flex flex-col gap-2">
                    {loading
                      ? 'Getting users...'
                      : users.map((user) => (
                          <div
                            className="p-2 border-black border-2 rounded-lg w-full flex flex-row"
                            key={user.id}
                          >
                            <div className="w-[80%] flex items-center">
                              <div>
                                <div>{user.name}</div>
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
