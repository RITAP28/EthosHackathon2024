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

const CreateGroupModal = ({
  isOpen,
  onClose,
  loading,
  setGroupName,
  setGroupDescription,
  users,
  handleAddUserInGroup,
  usersToAddInTheGroup,
  groupName,
  groupDescription,
  handleCreateGroup,
  groupCreationLoading,
}: {
  isOpen: boolean;
  onClose: () => void;
  loading: boolean;
  setGroupName: React.Dispatch<React.SetStateAction<string | null>>;
  setGroupDescription: React.Dispatch<React.SetStateAction<string | null>>;
  users: User[];
  handleAddUserInGroup: (user: User) => Promise<void>;
  usersToAddInTheGroup: User[];
  groupName: string | null;
  groupDescription: string | null;
  handleCreateGroup: () => Promise<void>;
  groupCreationLoading: boolean;
}) => {
  return (
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
  );
};

export default CreateGroupModal;
