import { useState, useEffect } from 'react'; 
import { withSessionSsr } from "@/lib/session";
import { getAllCourseSections } from "@/lib/courseSection";
import axios from "axios";
import "@/pages/global.css";
import React from 'react';

function ChangePassword() {
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [newPasswordConfirm, setNewPasswordConfirm] = useState("");
    const [errors, setErrors] = useState({});
    const [isFormValid, setIsFormValid] = useState(false);
    const [changeSuccessful, setChangeSuccessful] = useState(false);
    const [serverErrorMessage, setServerErrorMessage] = useState("");
  
    useEffect(() => {
      validateForm();
    }, [currentPassword, newPassword, newPasswordConfirm]);
  
    const validateForm = () => {
      let errors = {};
      if (newPassword !== newPasswordConfirm) {
        errors.newPass = "New password does not match";
      } else {
        if (newPassword.length < 8 && newPassword.length > 0) {
          errors.newPass = "New password must be at least 8 characters";
        }
      }
      setErrors(errors);
      setIsFormValid(Object.keys(errors).length === 0);
    };
  
    const changePassword = async () => {
      try {
        const response = await axios.post("/api/change-pass", { currentPassword, newPassword, newPasswordConfirm });
  
        if (response.data.success) {
          alert("done");
          setChangeSuccessful(true);
          setCurrentPassword("");
          setNewPassword("");
          setNewPasswordConfirm("");
        }
      } catch (error) {
        console.log(error);
        if (error.response && error.response.data && error.response.data.message) {
          alert(error.response.data.message);
          setServerErrorMessage(error.response.data.message);
        } else {
          setServerErrorMessage("Unknown error occurred");
          alert("Unknown error occurred");
        }
      }
    };
  
    return (
        <div className="p-4 flex flex-col items-center">
          <h3 className="text-xl font-bold mb-4">Change Admin Password</h3>
          {changeSuccessful && (
            <h2 className="text-green-500">Password successfully changed</h2>
          )}
          <div className="flex flex-col w-64">
            <label className="mb-2">
              Current Password
              <input
                className="border border-gray-300 p-1 rounded w-full"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
            </label>
            <label className="mb-2">
              New Password
              <input
                className="border border-gray-300 p-1 rounded w-full"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </label>
            <label className="mb-2">
              Confirm Password
              <input
                className="border border-gray-300 p-1 rounded w-full"
                type="password"
                value={newPasswordConfirm}
                onChange={(e) => setNewPasswordConfirm(e.target.value)}
              />
            </label>
            {errors.newPass && (
              <p className="text-red-500">{errors.newPass}</p>
            )}
            <button
              className="bg-blue-500 text-white px-4 py-2 rounded mt-4"
              type="submit"
              onClick={changePassword}
            >
              Change Password
            </button>
          </div>
        </div>
      );
  }

  export default ChangePassword;


