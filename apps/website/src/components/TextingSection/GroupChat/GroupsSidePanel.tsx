import { Group } from "../../../lib/interface";

const GroupsSidePanel = ({
  loadingGroups,
  setCreateGroupModal,
  setSearchUsersLoading,
  onOpen,
  getUsersFromDB,
  groups,
  handleClickOnAnyGroup,
}: {
  loadingGroups: boolean;
  setCreateGroupModal: React.Dispatch<React.SetStateAction<boolean | null>>;
  setSearchUsersLoading: React.Dispatch<React.SetStateAction<boolean | null>>;
  onOpen: () => void;
  getUsersFromDB: () => Promise<void>;
  groups: Group[];
  handleClickOnAnyGroup: (group: Group) => Promise<void>;
}) => {
  return loadingGroups ? (
    "Loading your groups"
  ) : (
    <div className="w-full flex flex-col">
      <div className="w-full flex justify-center">
        <button
          type="button"
          className="px-2 py-2 rounded-md bg-slate-400 text-black transition ease-in-out duration-200 hover:bg-slate-200 hover:cursor-pointer font-Philosopher"
          onClick={() => {
            setCreateGroupModal(true);
            setSearchUsersLoading(false);
            onOpen();
            getUsersFromDB();
          }}
        >
          Create group
        </button>
      </div>
      {groups.length > 0 ? (
        <div className="w-full flex flex-col gap-2 items-center pt-3">
          {groups.map((group, index) => (
            <div
              className="w-[90%] bg-slate-200 rounded-md px-2 py-2 hover:cursor-pointer transition duration-150 ease-in-out hover:bg-gray-400 font-Philosopher font-bold"
              key={index}
              onClick={() => {
                console.log("Group Details: ", group);
                handleClickOnAnyGroup(group);
              }}
            >
              <div className="">{group.name}</div>
              <div className="">{group.latestTextSentById}</div>
              <div className="text-sm font-sans font-light">
                {group.latestText}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="w-full flex justify-center">
          <div className="w-[80%]">Sorry, you are not a part of any group</div>
        </div>
      )}
    </div>
  );
};

export default GroupsSidePanel;
