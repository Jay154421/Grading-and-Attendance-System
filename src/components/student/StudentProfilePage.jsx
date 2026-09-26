import { useState, useEffect } from "react";
import StudentLayout from "../layout/student-layout";
import { Upload, Save } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient";
import { toast } from "../ui/toastApi";
import Button from "../ui/Button";
import { LoadingState, ErrorState } from "../ui/States";

const STORAGE_BUCKET = "student-profile-photos";

export default function StudentProfilePage() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [student, setStudent] = useState({
    id: "",
    fullName: "",
    email: "",
    photo: null,
  });
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  const loadProfile = async () => {
    try {
      setLoading(true);
      setLoadError(null);

      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();
      if (sessionError || !session) {
        navigate("/");
        return;
      }

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError || !user) {
        navigate("/");
        return;
      }

      setCurrentUser(user);

      const { data: studentData, error: studentError } = await supabase
        .from("students")
        .select("student_id, full_name, photo")
        .eq("email", user.email)
        .single();

      if (studentError) throw studentError;
      if (!studentData) throw new Error("Student record not found");

      setStudent({
        id: studentData.student_id || "",
        fullName: studentData.full_name || "",
        email: user.email || "",
        photo: studentData.photo || null,
      });

      if (studentData.photo) setPhotoPreview(studentData.photo);
    } catch (error) {
      setLoadError(error.message || "Your profile could not be loaded.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handlePhotoChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.match("image.*")) {
      toast.error("Please upload an image file (JPEG, PNG).");
      event.target.value = "";
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image size should be less than 2MB.");
      event.target.value = "";
      return;
    }

    setPhotoFile(file);

    const reader = new FileReader();
    reader.onloadend = () => setPhotoPreview(reader.result);
    reader.readAsDataURL(file);
  };

  const saveProfile = async () => {
    if (!currentUser || !student.id || !photoFile) return;
    setIsSaving(true);

    try {
      const { data: buckets } = await supabase.storage.listBuckets();
      if (!buckets?.some((b) => b.name === STORAGE_BUCKET)) {
        await supabase.storage.createBucket(STORAGE_BUCKET, {
          public: true,
          allowedMimeTypes: ["image/*"],
        });
      }

      const fileExt = photoFile.name.split(".").pop();
      const fileName = `${student.id}-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(fileName, photoFile);

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(fileName);

      const { error: updateError } = await supabase
        .from("students")
        .update({ photo: publicUrl, updated_at: new Date().toISOString() })
        .eq("email", currentUser.email);

      if (updateError) throw updateError;

      setStudent((prev) => ({ ...prev, photo: publicUrl }));
      setPhotoFile(null);
      toast.success("Profile photo updated.");
    } catch (error) {
      toast.error("Profile was not saved: " + (error.message || "unknown error"));
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <StudentLayout title="Profile">
        <LoadingState label="Loading your profile" />
      </StudentLayout>
    );
  }

  if (loadError) {
    return (
      <StudentLayout title="Profile">
        <ErrorState message={loadError} onRetry={loadProfile} />
      </StudentLayout>
    );
  }

  const details = [
    { term: "Student ID", value: student.id },
    { term: "Full Name", value: student.fullName },
    { term: "Email", value: student.email },
  ];

  return (
    <StudentLayout title="Profile">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">My Profile</h2>
        <p className="mt-1 text-sm text-gray-600">
          Your account details are read-only here. Ask your teacher to correct a name or
          student ID.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <section className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="p-4 border-b border-gray-200 bg-canvas">
            <h3 className="text-lg font-semibold text-gray-900">Profile Information</h3>
          </div>
          <div className="p-4">
            <dl className="space-y-4">
              {details.map((detail) => (
                <div key={detail.term}>
                  <dt className="text-sm font-medium text-gray-700">{detail.term}</dt>
                  <dd className="mt-1 rounded-md border border-gray-300 bg-canvas px-3 py-2.5 text-sm text-gray-900">
                    {detail.value || "-"}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        <section className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="p-4 border-b border-gray-200 bg-canvas">
            <h3 className="text-lg font-semibold text-gray-900">Profile Photo</h3>
          </div>
          <div className="p-4 space-y-4">
            <div className="flex flex-col items-center gap-4">
              <div className="h-32 w-32 rounded-full bg-gray-200 overflow-hidden flex items-center justify-center border-2 border-gray-300">
                {photoPreview ? (
                  <img
                    src={photoPreview}
                    alt=""
                    className="h-full w-full object-cover"
                    onError={() => setPhotoPreview(null)}
                  />
                ) : (
                  <span className="text-gray-700 font-medium text-4xl" aria-hidden="true">
                    {student.fullName?.split(" ").map((n) => n[0]).join("") || "ST"}
                  </span>
                )}
              </div>

              <div className="w-full space-y-2">
                <input
                  id="photo"
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  className="sr-only"
                />
                <label
                  htmlFor="photo"
                  className="flex min-h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-md border border-gray-500 bg-white px-4 text-sm font-medium text-gray-700 transition-colors hover:bg-canvas focus-within:ring-2 focus-within:ring-brand"
                >
                  <Upload className="h-4 w-4 text-gray-600" aria-hidden="true" />
                  {photoFile ? "Change photo" : "Upload photo"}
                </label>
                <p className="text-xs text-gray-600 text-center">
                  JPEG or PNG, up to 2MB.
                </p>
                {photoFile && (
                  <p className="text-xs text-gray-700 text-center" aria-live="polite">
                    Selected: {photoFile.name} ({Math.round(photoFile.size / 1024)}KB)
                  </p>
                )}
              </div>

              <Button
                onClick={saveProfile}
                disabled={isSaving || !photoFile}
                className="w-full justify-center"
              >
                {isSaving ? "Saving..." : "Save photo changes"}
                <Save className="h-4 w-4" aria-hidden="true" />
              </Button>
              {!photoFile && (
                <p className="text-xs text-gray-600 text-center">
                  Choose a new photo to enable saving.
                </p>
              )}
            </div>
          </div>
        </section>
      </div>
    </StudentLayout>
  );
}
