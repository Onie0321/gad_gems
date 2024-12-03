import { FaFacebook, FaInstagram } from "react-icons/fa";
import { FcGoogle } from "react-icons/fc";

export function SocialButton({ provider }) {
  const icons = {
    facebook: <FaFacebook className="w-5 h-5 text-blue-600" />,
    instagram: <FaInstagram className="w-5 h-5 text-pink-600" />,
    google: <FcGoogle className="w-5 h-5" />,
  };

  return (
    <button
      type="button"
      className="p-2 border border-gray-300 rounded-full hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
    >
      {icons[provider]}
    </button>
  );
}
