import React, { useState, useEffect } from "react";
import StudentLayout from "../layout/student-layout";
import { Upload, Save } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function StudentProfilePage() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [student, setStudent] = useState({
    id: '',
    fullName: '',
    email: '',
    photo: null
  });
  const [photoPreview, setPhotoPreview] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const user = localStorage.getItem("currentUser");
        if (!user) {
          navigate("/");
          return;
        }

        const userData = JSON.parse(user);
        setCurrentUser(userData);

        const students = JSON.parse(localStorage.getItem("students") || "[]");
        const studentRecord = students.find((s) => s.id === userData.id);

        if (!studentRecord) {
          setToastMessage("Student record not found");
          setToastVisible(true);
          setTimeout(() => setToastVisible(false), 3000);
          return;
        }

        setStudent({
          id: studentRecord.id || '',
          fullName: studentRecord.fullName || '',
          email: studentRecord.email || '',
          photo: studentRecord.photo || null
        });

        if (studentRecord.photo) {
          setPhotoPreview(studentRecord.photo);
        }
      } catch (error) {
        console.error("Error loading profile:", error);
        setToastMessage("Error loading profile data");
        setToastVisible(true);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [navigate]);

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.match('image.*')) {
        setToastMessage("Please upload an image file");
        setToastVisible(true);
        setTimeout(() => setToastVisible(false), 3000);
        return;
      }
      
      if (file.size > 2 * 1024 * 1024) {
        setToastMessage("Image size should be less than 2MB");
        setToastVisible(true);
        setTimeout(() => setToastVisible(false), 3000);
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const saveProfile = () => {
    if (!currentUser || !student.id) return;

    setIsSaving(true);

    try {
      const students = JSON.parse(localStorage.getItem("students") || "[]");
      const updatedStudents = students.map((s) => {
        if (s.id === currentUser.id) {
          return {
            ...s,
            photo: photoPreview,
          };
        }
        return s;
      });

      localStorage.setItem("students", JSON.stringify(updatedStudents));
      
      const updatedUser = {
        ...currentUser,
        photo: photoPreview
      };
      localStorage.setItem("currentUser", JSON.stringify(updatedUser));
      setCurrentUser(updatedUser);

      setToastMessage("Profile updated successfully!");
      setToastVisible(true);
    } catch (error) {
      setToastMessage("Failed to save profile. Please try again.");
      setToastVisible(true);
      console.error("Error saving profile:", error);
    } finally {
      setIsSaving(false);
      setTimeout(() => setToastVisible(false), 3000);
    }
  };

  if (loading) {
    return (
      <StudentLayout title="Profile">
        <div className="flex items-center justify-center h-full">
          <p>Loading profile...</p>
        </div>
      </StudentLayout>
    );
  }

  if (!currentUser || !student.id) {
    return (
      <StudentLayout title="Profile">
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <p className="text-red-500 mb-4">Unable to load profile data</p>
            <button 
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
            >
              Try Again
            </button>
          </div>
        </div>
      </StudentLayout>
    );
  }

  return (
    <StudentLayout title="Profile">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-4 text-red-800">My Profile</h2>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="bg-white rounded-lg border border-red-100 shadow-sm">
          <div className="p-4 border-b border-red-100 bg-red-50">
            <h3 className="text-lg font-bold text-red-800">Profile Information</h3>
          </div>
          <div className="p-4 space-y-4">
            <div className="space-y-2">
              <label htmlFor="studentId" className="block text-sm font-medium text-gray-700">
                Student ID
              </label>
              <input
                id="studentId"
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                value={student.id}
                readOnly
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">
                Full Name
              </label>
              <input
                id="fullName"
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                value={student.fullName}
                readOnly
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                id="email"
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                value={student.email}
                readOnly
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-red-100 shadow-sm">
          <div className="p-4 border-b border-red-100 bg-red-50">
            <h3 className="text-lg font-bold text-red-800">Profile Photo</h3>
          </div>
          <div className="p-4 space-y-4">
            <div className="flex flex-col items-center gap-4">
              <div className="h-32 w-32 rounded-full bg-gray-200 overflow-hidden flex items-center justify-center">
                {photoPreview ? (
                  <img 
                    src={photoPreview} 
                    alt="Profile" 
                    className="h-full w-full object-cover"
                    onError={() => setPhotoPreview(null)}
                  />
                ) : (
                  <span className="text-gray-500 font-medium text-4xl">
                    {student.fullName?.split(' ').map(n => n[0]).join('') || 'ST'}
                  </span>
                )}
              </div>
              <div className="w-full">
                <input 
                  id="photo" 
                  type="file" 
                  accept="image/*" 
                  onChange={handlePhotoChange} 
                  className="hidden" 
                />
                <label
                  htmlFor="photo"
                  className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md hover:bg-red-50 cursor-pointer transition-colors"
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Photo
                </label>
              </div>
              <button
                className="w-full flex items-center justify-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-red-400 transition-colors"
                onClick={saveProfile}
                disabled={isSaving || !photoPreview}
              >
                {isSaving ? "Saving..." : "Save Profile"}
                <Save className="ml-2 h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {toastVisible && (
        <div className="fixed bottom-4 right-4 bg-green-500 text-white px-4 py-2 rounded-md shadow-lg animate-fade-in-out">
          {toastMessage}
        </div>
      )}
    </StudentLayout>
  );
}