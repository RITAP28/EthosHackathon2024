import { useState } from "react";
import { Modal } from "./Modal";
import ImageModal from "./fileModal/ImageModal";
import VideoModal from "./fileModal/VideoModal";
import FilesModal from "./fileModal/FilesModal";
import { CurrentChat } from "../../../utils/interface";

const FileModal = ({
  isModalOpen,
  closeModal,
  currentChat,
  textMessage,
  setTextMessage,
  handleSendButtonClick,
}: {
  isModalOpen: boolean;
  closeModal: () => void;
  currentChat: CurrentChat;
  textMessage: string;
  setTextMessage: React.Dispatch<React.SetStateAction<string>>;
  handleSendButtonClick: (
    receiverId: number,
    receiverName: string,
    receiverEmail: string,
    mediaUrl: string | null,
    textMetadata: string
  ) => Promise<void>;
}) => {
  const [isOptionSelected, setIsOptionSelected] = useState<boolean>(false);
  const [openImageOption, setOpenImageOption] = useState<boolean>(false);
  const [openVideoOption, setOpenVideoOption] = useState<boolean>(false);
  const [openFileOption, setOpenFileOption] = useState<boolean>(false);

  const buttonClassname =
    "bg-red-400 text-white flex flex-col rounded-xl pb-2 hover:cursor-pointer hover:bg-red-500 transition duration-100 ease-in-out";

  const handleOpenImageOption = () => {
    setIsOptionSelected(true);
    setOpenImageOption(true);
  };

  const handleOpenVideoOption = () => {
    setIsOptionSelected(true);
    setOpenVideoOption(true);
  };

  const handleOpenFileOption = () => {
    setIsOptionSelected(true);
    setOpenFileOption(true);
  };
  return (
    <div className="w-[80%]">
      <Modal isOpen={isModalOpen} onClose={closeModal}>
        <div className="w-full">
          <div className="w-full">
            <h2 className="font-Manrope font-semibold pb-2 pl-2">
              Choose what you want to send:
            </h2>
          </div>
          {!isOptionSelected && (
            <div className="w-full flex flex-row">
              <div className="basis-1/3 w-full px-2 pt-2">
                <div
                  className={buttonClassname}
                  onClick={handleOpenImageOption}
                >
                  <div className="w-full flex justify-center items-center py-[1.5rem]">
                    <img
                      src="/fileModal/image.png"
                      alt="imgInput"
                      className="w-12 h-12"
                    />
                  </div>
                  <div className="w-full flex justify-center items-center py-1">
                    Images
                  </div>
                </div>
              </div>
              <div className="basis-1/3 w-full p-2">
                <div
                  className={buttonClassname}
                  onClick={handleOpenVideoOption}
                >
                  <div className="w-full flex justify-center items-center py-[1.5rem]">
                    <img
                      src="/fileModal/video.png"
                      alt="imgInput"
                      className="w-12 h-12"
                    />
                  </div>
                  <div className="w-full flex justify-center items-center py-1">
                    Videos
                  </div>
                </div>
              </div>
              <div className="basis-1/3 w-full p-2">
                <div className={buttonClassname} onClick={handleOpenFileOption}>
                  <div className="w-full flex justify-center items-center py-[1.5rem]">
                    <img
                      src="/fileModal/folder.png"
                      alt="imgInput"
                      className="w-12 h-12"
                    />
                  </div>
                  <div className="w-full flex justify-center items-center py-1">
                    Files
                  </div>
                </div>
              </div>
            </div>
          )}
          {isOptionSelected && openImageOption && (
            <ImageModal
              closeModal={closeModal}
              currentChat={currentChat}
              setOpenImageOption={setOpenImageOption}
              setIsOptionSelected={setIsOptionSelected}
              textMessage={textMessage}
              setTextMessage={setTextMessage}
              handleSendButtonClick={handleSendButtonClick}
            />
          )}
          {isOptionSelected && openVideoOption && (
            <VideoModal
              closeModal={closeModal}
              currentChat={currentChat}
              setOpenImageOption={setOpenImageOption}
              setIsOptionSelected={setIsOptionSelected}
            />
          )}
          {isOptionSelected && openFileOption && <FilesModal />}
        </div>
      </Modal>
    </div>
  );
};

export default FileModal;
