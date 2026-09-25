import { useState, useEffect } from "react"
import TeacherLayout from "../layout/teacher-layout"
import { Plus, Pencil, Trash, Upload, Users } from "lucide-react"
import { supabase } from "../../lib/supabaseClient"
import { toast } from "../ui/toastApi"
import Modal from "../ui/Modal"
import Button from "../ui/Button"
import { TextField, CheckboxGroup } from "../ui/Field"
import { LoadingState, EmptyState, ErrorState } from "../ui/States"

const EMPTY_FORM = {
  student_id: "",
  full_name: "",
  email: "",
  password: "",
  subjects: [],
  photo: null,
}

export default function StudentsPage() {
  const [students, setStudents] = useState([])
  const [subjects, setSubjects] = useState([])
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [currentStudent, setCurrentStudent] = useState(null)
  const [formData, setFormData] = useState(EMPTY_FORM)
  const [photoPreview, setPhotoPreview] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)
  const [processing, setProcessing] = useState(false)

  const fetchData = async () => {
    setLoading(true)
    setLoadError(null)
    try {
      const [subjectsResult, studentsResult] = await Promise.all([
        supabase.from("subjects").select("*"),
        supabase.from("students").select("*"),
      ])
      if (subjectsResult.error) throw subjectsResult.error
      if (studentsResult.error) throw studentsResult.error
      setSubjects(subjectsResult.data ?? [])
      setStudents(studentsResult.data ?? [])
    } catch (error) {
      setLoadError(error.message || "Students could not be loaded.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const registerStudentAccount = async (studentData) => {
    const { error } = await supabase.auth.signUp({
      email: studentData.email.trim(),
      password: studentData.password || "password",
      options: {
        data: {
          role: "student",
          student_id: studentData.student_id,
          full_name: studentData.full_name,
        },
      },
    })

    if (error) throw new Error(error.message)
  }

  const handleAddStudent = async () => {
    const studentId = formData.student_id.trim()
    const fullName = formData.full_name.trim()
    const email = formData.email.trim()

    if (!studentId || !fullName || !email) {
      toast.warning("Student ID, full name, and email are all required.")
      return
    }
    if (formData.subjects.length === 0) {
      toast.warning("Select at least one subject for this student.")
      return
    }

    setProcessing(true)
    try {
      await registerStudentAccount({ ...formData, student_id: studentId, full_name: fullName, email })

      const { data, error } = await supabase
        .from("students")
        .insert([
          {
            student_id: studentId,
            full_name: fullName,
            email,
            subjects: formData.subjects,
            photo: formData.photo,
          },
        ])
        .select()

      if (error) throw error
      if (!data?.[0]) throw new Error("the insert returned no row")

      setStudents([data[0], ...students])
      setIsAddDialogOpen(false)
      resetForm()
      toast.success("Student added.")
    } catch (err) {
      toast.error("Student was not added: " + err.message)
    } finally {
      setProcessing(false)
    }
  }

  const handleEditStudent = async () => {
    if (!currentStudent) return

    const fullName = formData.full_name.trim()
    const email = formData.email.trim()
    if (!fullName || !email) {
      toast.warning("Full name and email cannot be empty.")
      return
    }

    setProcessing(true)
    try {
      const { error } = await supabase
        .from("students")
        .update({
          full_name: fullName,
          email,
          subjects: formData.subjects,
          photo: formData.photo,
        })
        .eq("id", currentStudent.id)

      if (error) throw error

      if (email !== currentStudent.email) {
        const { error: authError } = await supabase.auth.admin.updateUserById(currentStudent.id, {
          email,
          user_metadata: { full_name: fullName },
        })
        if (authError) toast.warning("Record saved, but the login email was not updated: " + authError.message)
      }

      setStudents(
        students.map((student) =>
          student.id === currentStudent.id ? { ...student, ...formData, full_name: fullName, email } : student
        )
      )
      setIsEditDialogOpen(false)
      toast.success("Student updated.")
    } catch (err) {
      toast.error("Student was not updated: " + err.message)
    } finally {
      setProcessing(false)
    }
  }

  const handleDeleteStudent = async () => {
    if (!currentStudent) return

    setProcessing(true)
    try {
      const { error } = await supabase
        .from("students")
        .delete()
        .eq("id", currentStudent.id)

      if (error) throw error

      const { error: authError } = await supabase.auth.admin.deleteUser(currentStudent.id)
      if (authError) toast.warning("Student removed, but the login account still exists: " + authError.message)

      setStudents(students.filter((student) => student.id !== currentStudent.id))
      setIsDeleteDialogOpen(false)
      toast.success("Student deleted.")
    } catch (err) {
      toast.error("Student was not deleted: " + err.message)
    } finally {
      setProcessing(false)
    }
  }

  const openEditDialog = (student) => {
    setCurrentStudent(student)
    setFormData({
      student_id: student.student_id,
      full_name: student.full_name,
      email: student.email,
      subjects: student.subjects || [],
      photo: student.photo,
    })
    setPhotoPreview(student.photo)
    setIsEditDialogOpen(true)
  }

  const openDeleteDialog = (student) => {
    setCurrentStudent(student)
    setIsDeleteDialogOpen(true)
  }

  const closeDialogs = () => {
    setIsAddDialogOpen(false)
    setIsEditDialogOpen(false)
    setIsDeleteDialogOpen(false)
    resetForm()
  }

  const resetForm = () => {
    setFormData(EMPTY_FORM)
    setPhotoPreview(null)
    setCurrentStudent(null)
  }

  const handlePhotoChange = (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.type.match("image.*")) {
      toast.error("Choose a JPEG or PNG image file.")
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image must be smaller than 2MB.")
      return
    }

    const reader = new FileReader()
    reader.onloadend = () => {
      setFormData((prev) => ({ ...prev, photo: reader.result }))
      setPhotoPreview(reader.result)
    }
    reader.readAsDataURL(file)
  }

  const handleSubjectChange = (subjectId) => {
    setFormData((prev) => ({
      ...prev,
      subjects: prev.subjects.includes(subjectId)
        ? prev.subjects.filter((id) => id !== subjectId)
        : [...prev.subjects, subjectId],
    }))
  }

  const subjectPicker = (
    <CheckboxGroup legend="Subjects" hint="Pick every subject this student is enrolled in.">
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {subjects.length === 0 && (
          <p className="text-sm text-gray-600">
            No subjects exist yet. Add a subject first.
          </p>
        )}
        {subjects.map((subject) => (
          <label
            key={subject.id}
            className="flex min-h-11 cursor-pointer items-center gap-3 rounded-md px-2 hover:bg-gray-50"
          >
            <input
              type="checkbox"
              checked={formData.subjects.includes(subject.id)}
              onChange={() => handleSubjectChange(subject.id)}
              className="h-4 w-4 rounded border-gray-500 text-red-600 focus:ring-red-500"
            />
            <span className="text-sm text-gray-700">
              {subject.name} <span className="text-gray-600">({subject.code})</span>
            </span>
          </label>
        ))}
      </div>
    </CheckboxGroup>
  )

  const photoPicker = (
    <div>
      <span className="mb-1 block text-sm font-medium text-gray-700">Photo</span>
      <div className="flex items-center gap-4">
        <div className="h-20 w-20 shrink-0 overflow-hidden rounded-full border-2 border-gray-300 bg-gray-100 flex items-center justify-center">
          {photoPreview ? (
            <img src={photoPreview} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="text-lg font-medium text-gray-700">
              {formData.full_name
                ? formData.full_name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase()
                : "ST"}
            </span>
          )}
        </div>
        <div className="flex-1">
          <input
            id="photo"
            type="file"
            accept="image/*"
            onChange={handlePhotoChange}
            className="sr-only"
          />
          <label
            htmlFor="photo"
            className="inline-flex min-h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-md border border-gray-500 bg-white px-4 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 focus-within:ring-2 focus-within:ring-red-500"
          >
            <Upload className="h-4 w-4 text-gray-600" aria-hidden="true" />
            <span>{photoPreview ? "Change Photo" : "Upload Photo"}</span>
          </label>
          <p className="mt-1 text-xs text-gray-600">JPEG or PNG, up to 2MB.</p>
        </div>
      </div>
    </div>
  )

  return (
    <TeacherLayout title="Students">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Manage Students</h2>
          <p className="mt-1 text-sm text-gray-600">
            Enroll students, correct their details, and assign subjects.
          </p>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="h-5 w-5" aria-hidden="true" />
          Add Student
        </Button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800">Student List</h3>
        </div>
        <div className="p-5">
          {loading ? (
            <LoadingState label="Loading students" />
          ) : loadError ? (
            <ErrorState message={loadError} onRetry={fetchData} />
          ) : students.length === 0 ? (
            <EmptyState
              icon={Users}
              title="No students yet"
              description="Add a student to start taking attendance and recording grades."
              action={
                <Button onClick={() => setIsAddDialogOpen(true)}>
                  <Plus className="h-5 w-5" aria-hidden="true" />
                  Add Student
                </Button>
              }
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th scope="col" className="text-left p-3 text-sm font-medium text-gray-600">Photo</th>
                    <th scope="col" className="text-left p-3 text-sm font-medium text-gray-600">Student ID</th>
                    <th scope="col" className="text-left p-3 text-sm font-medium text-gray-600">Name</th>
                    <th scope="col" className="text-left p-3 text-sm font-medium text-gray-600">Email</th>
                    <th scope="col" className="text-left p-3 text-sm font-medium text-gray-600">Subjects</th>
                    <th scope="col" className="text-right p-3 text-sm font-medium text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((student) => (
                    <tr key={student.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="p-3">
                        <div className="h-10 w-10 rounded-full bg-gray-100 overflow-hidden flex items-center justify-center border border-gray-200">
                          {student.photo ? (
                            <img src={student.photo} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <span className="text-sm font-medium text-gray-700">
                              {student.full_name
                                ?.split(" ")
                                .map((n) => n[0])
                                .join("")
                                .slice(0, 2)
                                .toUpperCase()}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-3 text-sm text-gray-700">{student.student_id}</td>
                      <td className="p-3 text-sm font-medium text-gray-800">{student.full_name}</td>
                      <td className="p-3 text-sm text-gray-700">{student.email}</td>
                      <td className="p-3 text-sm text-gray-700">
                        {student.subjects?.length > 0
                          ? student.subjects
                              .map((id) => subjects.find((s) => s.id === id)?.name)
                              .filter(Boolean)
                              .join(", ") || "No subjects"
                          : "No subjects"}
                      </td>
                      <td className="p-2 text-right">
                        <div className="flex justify-end">
                          <button
                            type="button"
                            className="inline-flex h-11 w-11 items-center justify-center rounded-md text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                            aria-label={`Edit ${student.full_name}`}
                            onClick={() => openEditDialog(student)}
                          >
                            <Pencil className="h-4 w-4" aria-hidden="true" />
                          </button>
                          <button
                            type="button"
                            className="inline-flex h-11 w-11 items-center justify-center rounded-md text-red-700 transition-colors hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                            aria-label={`Delete ${student.full_name}`}
                            onClick={() => openDeleteDialog(student)}
                          >
                            <Trash className="h-4 w-4" aria-hidden="true" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <Modal
        open={isAddDialogOpen}
        onClose={closeDialogs}
        title="Add New Student"
        description="Create the login account and the student record in one step."
        width="max-w-xl"
        footer={
          <>
            <Button variant="secondary" onClick={closeDialogs} disabled={processing}>
              Cancel
            </Button>
            <Button
              onClick={handleAddStudent}
              disabled={
                !formData.student_id.trim() ||
                !formData.full_name.trim() ||
                !formData.email.trim() ||
                formData.subjects.length === 0 ||
                processing
              }
            >
              {processing ? "Adding..." : "Add Student"}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField
              id="student_id"
              label="Student ID"
              required
              placeholder="e.g., 2023-12345"
              value={formData.student_id}
              onChange={(e) => setFormData({ ...formData, student_id: e.target.value })}
            />
            <TextField
              id="full_name"
              label="Full Name"
              required
              placeholder="e.g., Juan Dela Cruz"
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
            />
          </div>
          <TextField
            id="email"
            label="Email"
            type="email"
            required
            placeholder="e.g., juan@example.com"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />
          <TextField
            id="password"
            label="Password"
            type="password"
            autoComplete="new-password"
            placeholder="Leave blank to use the default"
            hint='Default password is "password". Tell the student to change it after first login.'
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          />
          {subjectPicker}
          {photoPicker}
        </div>
      </Modal>

      <Modal
        open={isEditDialogOpen}
        onClose={closeDialogs}
        title="Edit Student"
        description={currentStudent ? `Editing ${currentStudent.full_name}` : undefined}
        width="max-w-xl"
        footer={
          <>
            <Button variant="secondary" onClick={closeDialogs} disabled={processing}>
              Cancel
            </Button>
            <Button
              onClick={handleEditStudent}
              disabled={!formData.full_name.trim() || !formData.email.trim() || processing}
            >
              {processing ? "Saving..." : "Save Changes"}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <TextField
            id="edit-student_id"
            label="Student ID"
            hint="The student ID is fixed after the record is created."
            readOnly
            disabled
            value={formData.student_id}
            onChange={() => {}}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField
              id="edit-full_name"
              label="Full Name"
              required
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
            />
            <TextField
              id="edit-email"
              label="Email"
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>
          {subjectPicker}
          {photoPicker}
        </div>
      </Modal>

      <Modal
        open={isDeleteDialogOpen}
        onClose={closeDialogs}
        title="Delete Student"
        description={
          currentStudent
            ? `This permanently removes ${currentStudent.full_name} and their login account.`
            : undefined
        }
        footer={
          <>
            <Button variant="secondary" onClick={closeDialogs} disabled={processing}>
              Cancel
            </Button>
            <Button onClick={handleDeleteStudent} disabled={processing}>
              {processing ? "Deleting..." : "Delete Student"}
            </Button>
          </>
        }
      >
        <p className="text-sm text-gray-700">
          Their grades and attendance history are removed too. Export a report first if you
          need to keep the record.
        </p>
      </Modal>
    </TeacherLayout>
  )
}
