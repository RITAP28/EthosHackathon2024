/* eslint-disable no-console */
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useDispatch } from 'react-redux';
import { useAppSelector } from '../redux/hooks/hook';
import { LogoutSuccess } from '../redux/slices/user.slice';

function SecondNavbar() {
  const { currentUser, isAuthenticated } = useAppSelector(
    (state) => state.user,
  );
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
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
  return (
    <div className="w-full h-[5%] bg-slate-600 flex flex-row justify-between">
      <div className="flex flex-row">
        {isAuthenticated && !(location.pathname === '/') && (
          <div className="">
            <button
              type="button"
              className="px-4 py-1 bg-white text-black rounded-md hover:cursor-pointer hover:bg-black hover:text-white"
              onClick={() => {
                navigate(-1);
              }}
            >
              Back
            </button>
          </div>
        )}
        <div className="">{`WhatsApp for ${currentUser?.name}`}</div>
      </div>
      <div className="">
        <button
          type="button"
          className="px-4 py-1 bg-black text-white rounded-md hover:cursor-pointer hover:bg-white hover:text-black"
          onClick={() => {
            handleLogout(currentUser?.id as number);
          }}
        >
          Logout
        </button>
      </div>
    </div>
  );
}

export default SecondNavbar;
