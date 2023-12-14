import { useState } from 'react'; 
import { useRouter } from 'next/router';
import { withSessionSsr } from "@/lib/session";
import { getAllCourseSections } from "@/lib/courseSection";
import ChangePassword from '@/components/change-password';
import EditClasses from '@/components/edit-classes';
import axios from "axios";
import "./global.css";
import "./admin-settings.css";

function AdminSettings(props) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("password");
  if (props.userId === -1) {
    return (<h2 className="text-red-500">Unauthorized. Please login to see this page.</h2>);
  }

  

  const navigateToHome = () => {
    router.push('/'); // Change the path to your home page route
  };

  return (
    <div className="flex flex-col items-center h-screen"> {/* Centering container */}
      <div className="side-panel-header fixed top-0 left-0 right-0 bg-black z-10"> {/* Fixed position */}
        <button
          className={`tab-button ${activeTab === "password" ? "active" : ""}`}
          onClick={() => setActiveTab("password")}
        >
          Change Password
        </button>
        <button
          className={`tab-button ${activeTab === "edit-classes" ? "active" : ""}`}
          onClick={() => setActiveTab("edit-classes")}
        >
          Edit Classes
        </button>
        <button
          className="tab-button ml-auto" // Aligns to the right
          onClick={navigateToHome}
        >
          Go to Home
        </button>
      </div>
      <div className="mt-16"> {/* Margin to avoid overlapping with fixed tabs */}
        {activeTab === "password" && (
          <ChangePassword />
        )}
        {activeTab === "edit-classes" && (
          <EditClasses sections={props.data.sections}/>
        )}
      </div>
    </div>
  );
}

export const getServerSideProps = withSessionSsr(async function ({ req, res }) {
  if (req.session.user) {
    const username = req.session.user.username;
    const userId = parseInt(req.session.user.userId);
    const sections = await getAllCourseSections();
    const data = { 
      sections,
      username,
      userId
    };
    // Pass data to the page via props
    return { props: { data } };
  } else {
    return {
      props: {
        username: "",
        userId: -1
      }
    };
  }
});

export default AdminSettings;