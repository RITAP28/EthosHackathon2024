import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
} from "@chakra-ui/react";
import { useState } from "react";
import { User } from "../lib/interface";
import axios from "axios";
import { useAppSelector } from "../redux/hooks/hook";
import { FaUser } from "react-icons/fa";

const TextingSection = () => {
  const { currentUser } = useAppSelector((state) => state.user);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [loading, setLoading] = useState<boolean>(false);
  const [users, setUsers] = useState<User[]>([]);

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

  return (
    <div className="w-full flex justify-start items-center h-[100%]">
      <div className="w-[99%] h-[97%] bg-slate-300 rounded-2xl">
        <div className="w-full h-full flex flex-row">
          <div className="w-[30%] h-[100%] flex flex-col">
            <div className="w-full flex justify-center pt-4">
              <input
                type="search"
                name=""
                className="w-[70%] py-2 pl-4 bg-slate-400 text-white rounded-lg placeholder:text-white font-Philosopher"
                placeholder="Search"
                onClick={() => {
                  onOpen();
                  getUsersFromDB();
                }}
              />
            </div>
            <div className="w-full flex justify-center pt-2">
              <p className="w-[70%] font-Philosopher">
                Users you chat with will appear here
              </p>
            </div>
          </div>
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
                      className="w-full flex flex-row py-4 bg-slate-400"
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
