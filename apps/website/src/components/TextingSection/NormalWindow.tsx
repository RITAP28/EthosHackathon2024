import { CiLock } from "react-icons/ci";

const NormalWindow = () => {
  return (
    <div className="w-[75%] h-[100%] bg-slate-400 flex flex-col rounded-r-2xl">
      <div className="w-full h-[90%] flex justify-center items-center">
        <p className="font-bold font-Philosopher">
          This is your alternative to the <br /> Boring Whats-App you have been
          using!
        </p>
      </div>
      <div className="w-full h-[10%] flex justify-center">
        <p className="flex items-center gap-2 font-semibold font-Philosopher">
          <CiLock />
          Your personal messages are end-to-end encrypted
        </p>
      </div>
    </div>
  );
};

export default NormalWindow;
