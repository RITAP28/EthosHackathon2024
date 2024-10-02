import React, { useState } from "react";
import { ShootingStars } from "../../components/ui/ShootingStars";
import { StarsBackground } from "../../components/ui/StarBackground";
import { User } from "../../lib/interface";
import { useToast } from "@chakra-ui/react";
import { LoginSchema } from "../../lib/zodSchemas";
import axios from "axios";
import { useDispatch } from "react-redux";
import { LoginSuccess } from "../../redux/slices/user.slice";
import { useNavigate } from "react-router-dom";

const Home = () => {
  const dispatch = useDispatch();
  const toast = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState<boolean>(false);
  const [formData, setFormData] = useState<User>({
    name: "",
    email: "",
    password: ""
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.id]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    setLoading(true);
    try {
      e.preventDefault();
      console.log(formData);
      const zodValidatedFormData = LoginSchema.safeParse(formData);
      if(!zodValidatedFormData.success){
        console.error('Validation failed: ', zodValidatedFormData.error.message);
        toast({
          title: 'Login failed',
          description: `${zodValidatedFormData.error.message}`,
          status: 'error',
          duration: 4000,
          isClosable: true
        });
      } else {
        console.log('zod validated form: ', zodValidatedFormData.data);
        const loginResponse = await axios.post(`http://localhost:8000/login`, zodValidatedFormData.data);
        console.log('Login response: ', loginResponse.data);
        dispatch(LoginSuccess(loginResponse.data.user));
        navigate('/');
        toast({
          title: 'Login Successful',
          description: `Welcome to Nebula, ${loginResponse.data.user.name}`,
          status: 'success',
          duration: 4000,
          isClosable: true
        });
      };
    } catch (error) {
      console.error('Error while logging in: ', error);
      toast({
        title: 'Login failed',
        description: 'Invalid Credentials. Please try again',
        status: 'error',
        duration: 4000,
        isClosable: true
      });
    };
    setLoading(false);
  };
  return (
    <div className="min-h-screen bg-neutral-900 flex flex-col items-center justify-center relative w-full">
      <h2 className="relative flex-col md:flex-row z-10 text-3xl md:text-5xl md:leading-tight max-w-5xl mx-auto text-center tracking-tight font-medium bg-clip-text text-transparent bg-gradient-to-b from-neutral-800 via-white to-white flex items-center gap-2 md:gap-8">
        <span>Nebula</span>
      </h2>
      <div className="w-full flex justify-center">
        <div className="w-[40%] flex justify-center">
          <p className="bg-clip-text text-transparent bg-gradient-to-b from-neutral-800 via-white to-white">
            Welcome to Nebula! Login to start texting
          </p>
        </div>
      </div>
      <div className="w-full flex justify-center pt-[1.5rem] z-20">
        <div className="w-[25%] flex justify-center">
          <form
            method="post"
            action=""
            className="w-full border-[1px] border-slate-700 rounded-lg pt-[1rem] pb-[2rem]"
            onSubmit={handleSubmit}
          >
            <div className="flex flex-col pb-4">
              <label
                htmlFor=""
                className="bg-clip-text text-transparent bg-gradient-to-b from-neutral-800 via-white to-white pl-9 pb-1"
              >
                Email:
              </label>
              <div className="w-full flex justify-center">
                <input
                  type="text"
                  name=""
                  id="email"
                  className="w-[80%] pl-2 py-1 rounded-md bg-transparent border-[1px] border-slate-700 text-slate-400"
                  placeholder="Email"
                  onChange={handleInputChange}
                />
              </div>
            </div>
            <div className="flex flex-col pb-4">
              <label
                htmlFor=""
                className="bg-clip-text text-transparent bg-gradient-to-b from-neutral-800 via-white to-white pl-9 pb-1"
              >
                Password:
              </label>
              <div className="w-full flex justify-center">
                <input
                  type="text"
                  name=""
                  id="password"
                  className="w-[80%] rounded-md py-1 pl-2 bg-transparent border-[1px] border-slate-700 text-slate-400"
                  placeholder="Password"
                  onChange={handleInputChange}
                />
              </div>
              <div className="w-full flex justify-center text-[0.75rem] pt-1">
                <div className="w-[80%]">
                  <p className="w-full flex justify-end bg-clip-text text-transparent bg-gradient-to-b from-neutral-800 via-white to-white">Forgotten Password?</p>
                </div>
              </div>
            </div>
            <div className="w-full flex justify-center">
              <button
                type="submit"
                className="w-[80%] py-2 rounded-md bg-clip-text text-transparent bg-gradient-to-b from-neutral-800 via-white to-white border-[0.5px] border-slate-700 text-lg hover:cursor-pointer hover:border-slate-300 transition duration-400 ease-in-out"
              >
                {loading ? "Signing you in..." : "Sign In"}
              </button>
            </div>
            <div className="w-full flex justify-center pt-2">
              <button
                type="submit"
                className="w-[80%] py-2 rounded-md bg-clip-text text-transparent bg-gradient-to-b from-neutral-800 via-white to-white border-[0.5px] border-slate-700 text-lg hover:cursor-pointer hover:border-slate-300 transition duration-400 ease-in-out"
              >
               <span className="w-full flex justify-center items-center gap-2">Continue with <img src="/google.png" className="w-5 h-5 flex justify-center" alt="" /></span>
              </button>
            </div>
            <div className="w-full flex justify-center pt-2">
              <p className="bg-clip-text text-sm text-transparent bg-gradient-to-b from-neutral-800 via-white to-white">
                Don't have an account?<span className="pl-2"><a href="/register">Register</a></span>
              </p>
            </div>
          </form>
        </div>
      </div>
      <ShootingStars minDelay={2000} maxDelay={3000} />
      <StarsBackground starDensity={0.001} />
    </div>
  );
};

export default Home;
