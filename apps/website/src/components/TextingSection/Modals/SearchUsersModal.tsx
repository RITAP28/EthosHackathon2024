import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
} from "@chakra-ui/react";
import { User } from "../../../lib/interface";
import { FaUser } from "react-icons/fa";
import { useAppSelector } from "../../../redux/hooks/hook";

const SearchUsersModal = ({
  isOpen,
  onClose,
  loading,
  users,
  handleChatButtonClick,
  insertingChatPartnerInDB,
}: {
  isOpen: boolean;
  onClose: () => void;
  loading: boolean;
  users: User[];
  handleChatButtonClick: (
    receiverId: number,
    receiverName: string,
    receiverEmail: string
  ) => Promise<void>;
  insertingChatPartnerInDB: (
    senderId: number,
    chatPartnerId: number,
    senderName: string,
    senderEmail: string,
    chatPartnerName: string,
    chatPartnerEmail: string
  ) => Promise<void>;
}) => {
  const { currentUser } = useAppSelector((state) => state.user);
  return (
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
  );
};

export default SearchUsersModal;
