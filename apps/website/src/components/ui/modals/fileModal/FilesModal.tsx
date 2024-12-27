const FilesModal = () => {
  return (
    <>
      <div className="w-full flex flex-row">
        <div className="w-[30%] pl-2 flex justify-end">Choose File:</div>
        <div className="w-[70%] flex justify-start pl-4">
          <input type="file" className="w-full" accept="file/*" />
        </div>
      </div>
      <div className="w-full flex flex-row py-2">
        <div className="w-[30%] pl-2 flex justify-end">
          Write Caption(optional):
        </div>
        <div className="w-[70%] flex justify-start pl-4">
          <input
            type="text"
            name="imgCaption"
            id="imgCaption"
            placeholder="Caption..."
            className="w-[80%] border-[1px] border-black rounded-md pl-2"
          />
        </div>
      </div>
      <div className="w-full flex justify-center items-center">
        <button
          type="button"
          className="px-4 py-1 rounded-md hover:cursor-pointer bg-slate-500 text-white hover:bg-slate-600 transition duration-150 ease-in-out"
        >
          Send
        </button>
      </div>
    </>
  );
};

export default FilesModal;
