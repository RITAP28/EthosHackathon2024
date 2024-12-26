import { ShootingStars } from "../../components/ui/ShootingStars";
import { StarsBackground } from "../../components/ui/StarBackground";
import { MdTextsms } from "react-icons/md";
import { MdKeyboardVoice } from "react-icons/md";
import { MdOutlineVideoCall } from "react-icons/md";
import { FaLock } from "react-icons/fa";
import React, { useState } from "react";
import { User } from "../../utils/interface";
import axios from "axios";
import { useDispatch } from "react-redux";
import { RegistrationSuccess } from "../../redux/slices/user.slice";
import { useToast } from "@chakra-ui/react";
import { RegisterSchema } from "../../utils/zodSchemas";
import { useNavigate } from "react-router-dom";

const Register = () => {
  const dispatch = useDispatch();
  const toast = useToast();
  const navigate = useNavigate();
  // const [error, setError] = useState<boolean>(false);
  // const [errorMsg, setErrorMsg] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [formData, setFormData] = useState<User>({
    name: "",
    email: "",
    password: "",
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.id]: e.target.value
    })
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) =>{
    setLoading(true);
    try {
      e.preventDefault();
      console.log(formData);
      const zodValidatedFormData = RegisterSchema.safeParse(formData);
      if(!zodValidatedFormData.success){
        console.error('Validation failed: ', zodValidatedFormData.error);
        toast({
          title: 'Registration failed',
          description: `${zodValidatedFormData.error.message}`,
          status: 'error',
          duration: 4000,
          isClosable: true
        });
        return;
      } else {
        console.log('zod validated form: ', zodValidatedFormData);
        const registerResponse = await axios.post(`http://localhost:8000/register`, zodValidatedFormData.data, {
          headers: {
            'Content-Type': 'application/json'
          }
        });
        console.log('Registration result: ', registerResponse.data);
        dispatch(RegistrationSuccess(registerResponse.data));
        navigate('/');
        toast({
          title: 'Registration successful',
          description: `You have successfully registered for Nebula. You can begin texting now!`,
          status: 'success',
          duration: 4000,
          isClosable: true
        });
      };
    } catch (error) {
      console.error('Error while submitting register form', error);
      toast({
        title: 'Registration failed',
        description: 'There was an error while registering. Please try again later.',
        status: 'error',
        duration: 4000,
        isClosable: true
      });
    };
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-neutral-900 flex flex-col justify-center items-center relative w-full">
      <div className="w-full h-full flex flex-row">
        <div className="basis-1/2 w-full flex flex-col leading-tight">
          <p className="w-full bg-clip-text text-[5rem] text-transparent bg-gradient-to-b from-neutral-800 via-white to-white pl-[2rem]">
            Experience E2EE
          </p>
          <p className="w-full bg-clip-text text-[2rem] text-transparent bg-gradient-to-b from-neutral-800 via-white to-white pl-[2rem]">
            messaging like never before...
          </p>
          <div className="w-full flex justify-center pt-2">
            <div className="w-[90%] flex flex-col justify-start">
              <div className="w-full flex flex-row items-center py-2 gap-2 bg-clip-text text-transparent bg-gradient-to-b from-neutral-800 via-white to-white">
                <MdTextsms className="text-white text-[1.6rem] flex items-center" />
                <p className="text-[1.7rem]">Text anyone you like</p>
              </div>
              <div className="w-full flex flex-row items-center py-2 gap-2 bg-clip-text text-transparent bg-gradient-to-b from-neutral-800 via-white to-white">
                <MdKeyboardVoice className="text-white text-[1.6rem] flex items-center" />
                <p className="text-[1.7rem]">Send Chats via Voice</p>
              </div>
              <div className="w-full flex flex-row items-center py-2 gap-2 bg-clip-text text-transparent bg-gradient-to-b from-neutral-800 via-white to-white">
                <MdOutlineVideoCall className="text-white text-[1.6rem] flex items-center" />
                <p className="text-[1.7rem]">Video Calls</p>
              </div>
              <div className="w-full flex flex-row items-center py-2 gap-2 bg-clip-text text-transparent bg-gradient-to-b from-neutral-800 via-white to-white">
                <FaLock className="text-white text-[1.6rem] flex items-center" />
                <p className="text-[1.7rem]">End-to-End Encryption texting</p>
              </div>
            </div>
          </div>
        </div>
        <div className="basis-1/2 w-full flex justify-center z-20">
          <div className="w-[80%] flex justify-center">
            <form
              action=""
              method="post"
              className="w-[60%] border-[0.6px] border-slate-400 rounded-lg flex flex-col py-4"
              onSubmit={handleSubmit}
            >
              <div className="w-full pb-2 flex justify-center">
                <h2 className="bg-clip-text text-transparent bg-gradient-to-b from-neutral-800 via-white to-white text-[1.5rem]">
                  Register!
                </h2>
              </div>
              <div className="w-full flex flex-col pb-4">
                <label
                  htmlFor=""
                  className="w-full pl-7 bg-clip-text text-transparent bg-gradient-to-b from-neutral-800 via-white to-white"
                >
                  Username:
                </label>
                <div className="w-full flex justify-center pt-1">
                  <input
                    type="text"
                    name=""
                    id="name"
                    className="w-[80%] pl-2 py-1 rounded-md bg-transparent border-[1px] border-slate-700 text-slate-400"
                    placeholder="Username..."
                    onChange={handleInputChange}
                  />
                </div>
              </div>
              <div className="w-full flex flex-col pb-4">
                <label
                  htmlFor=""
                  className="w-full pl-7 bg-clip-text text-transparent bg-gradient-to-b from-neutral-800 via-white to-white"
                >
                  Email:
                </label>
                <div className="w-full flex justify-center pt-1">
                  <input
                    type="text"
                    name=""
                    id="email"
                    className="w-[80%] pl-2 py-1 rounded-md bg-transparent border-[1px] border-slate-700 text-slate-400"
                    placeholder="Email..."
                    onChange={handleInputChange}
                  />
                </div>
              </div>
              <div className="w-full flex flex-col pb-4">
                <label
                  htmlFor=""
                  className="w-full pl-7 bg-clip-text text-transparent bg-gradient-to-b from-neutral-800 via-white to-white"
                >
                  Password:
                </label>
                <div className="w-full flex justify-center pt-1">
                  <input
                    type="text"
                    name=""
                    id="password"
                    className="w-[80%] pl-2 py-1 rounded-md bg-transparent border-[1px] border-slate-700 text-slate-400"
                    placeholder="Password..."
                    onChange={handleInputChange}
                  />
                </div>
              </div>
              {/* {error && (
                <div className="w-full flex justify-center">
                  <p className="w-[90%] px-2 text-sm text-red-500">
                    {errorMsg}
                  </p>
                </div>
              )} */}
              <div className="w-full flex justify-center">
                <button
                  type="submit"
                  className="w-[80%] py-2 rounded-md bg-clip-text text-transparent bg-gradient-to-b from-neutral-800 via-white to-white border-[0.5px] border-slate-700 text-lg hover:cursor-pointer hover:border-slate-300 transition duration-400 ease-in-out"
                >
                  {loading ? "Registering you..." : "Register"}
                </button>
              </div>
              <div className="w-full flex justify-center pt-2">
                <button
                  type="submit"
                  className="w-[80%] py-2 rounded-md bg-clip-text text-transparent bg-gradient-to-b from-neutral-800 via-white to-white border-[0.5px] border-slate-700 text-lg hover:cursor-pointer hover:border-slate-300 transition duration-400 ease-in-out"
                >
                  <span className="w-full flex justify-center items-center gap-2">
                    Continue with{" "}
                    <img
                      src="/google.png"
                      className="w-5 h-5 flex justify-center"
                      alt=""
                    />
                  </span>
                </button>
              </div>
              <div className="w-full flex justify-center pt-2">
                <p className="bg-clip-text text-sm text-transparent bg-gradient-to-b from-neutral-800 via-white to-white">
                  Already have an account?
                  <span className="pl-2">
                    <a href="/">Login</a>
                  </span>
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>
      <ShootingStars minDelay={2000} maxDelay={3000} />
      <StarsBackground starDensity={0.001} />
    </div>
  );
};

export default Register;
